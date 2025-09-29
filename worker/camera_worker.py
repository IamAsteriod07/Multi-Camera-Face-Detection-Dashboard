# Delay importing cv2 to runtime to avoid import-time failures in environments
cv2 = None
import time
import threading
import requests
import os
import json
import base64
import subprocess
from collections import deque
try:
    import boto3  # type: ignore[import]
    from botocore.exceptions import BotoCoreError, ClientError  # type: ignore[import]
except Exception:
    boto3 = None
    BotoCoreError = Exception
    ClientError = Exception

try:
    import pika  # type: ignore[import]
except Exception:
    pika = None

from worker.mocks import MockS3Client, MockMQConnection
import tempfile
import urllib.request
import hashlib
import shutil


class CameraWorker(threading.Thread):
    """A worker thread that reads RTSP, runs face detection, overlays, and
    pushes processed frames to MediaMTX via ffmpeg, plus posts alerts to backend.
    """

    def __init__(self, cfg):
        super().__init__(daemon=True)
        self.cfg = cfg
        self.id = cfg.get("id")
        self.rtsp = cfg.get("rtsp")
        self.test_video = cfg.get("test_video") or ''
        self.max_frames = int(cfg.get('max_frames', 0) or 0)
        self.ffmpeg_output = cfg.get("ffmpeg_output")
        self.save_snapshots = cfg.get("save_snapshots", False)
        self.backend_alert_url = cfg.get("backend_alert_url")
        self.min_confidence = cfg.get("min_confidence", 0.5)
        self.skip_frames = cfg.get("skip_frames", 0)
        self.running = True
        # DNN face detector (OpenCV's res10_300x300_ssd) - model files path
        self.model_dir = os.path.join(os.getcwd(), 'worker', 'models')
        os.makedirs(self.model_dir, exist_ok=True)
        self.prototxt = os.path.join(self.model_dir, 'deploy.prototxt')
        self.model = os.path.join(self.model_dir, 'res10_300x300_ssd_iter_140000_fp16.caffemodel')
        # models config
        self.models_cfg = cfg.get('models') or {}
        self._ensure_dnn_model()
        # Net will be loaded lazily when run() starts and cv2 is available
        self.net = None

        # Frame queue for ffmpeg pipe
        self.frame_queue = deque(maxlen=2)
        # S3 client if enabled
        self.s3_cfg = cfg.get('s3') or {}
        self.s3_client = None
        local_mocks = cfg.get('local_mocks') or {}
        if local_mocks.get('use_mock_s3'):
            self.s3_client = MockS3Client()
        elif self.s3_cfg.get('enabled'):
            try:
                self.s3_client = boto3.client(
                    's3',
                    region_name=self.s3_cfg.get('region') or None,
                    aws_access_key_id=self.s3_cfg.get('access_key') or None,
                    aws_secret_access_key=self.s3_cfg.get('secret_key') or None,
                )
            except Exception as e:
                print(f"[{self.id}] failed to init S3 client: {e}")

        # MQ config
        self.mq_cfg = cfg.get('mq') or {}
        self.mq_conn = None
        self.mq_channel = None
        if local_mocks.get('use_mock_mq'):
            self.mq_conn = MockMQConnection()
            self.mq_channel = self.mq_conn.channel()
        else:
            self._ensure_mq()

    def stop(self):
        self.running = False

    def run(self):
        backoff = 1.0
        max_backoff = 60.0
        while self.running:
            cap = None
            try:
                # Import cv2 at runtime
                global cv2
                if cv2 is None:
                    try:
                        import cv2 as _cv2
                        cv2 = _cv2
                    except Exception as e:
                        raise RuntimeError(f"OpenCV import failed: {e}")

                source = self.test_video if self.test_video else self.rtsp
                cap = cv2.VideoCapture(source)
                if not cap.isOpened():
                    raise RuntimeError("Failed to open RTSP stream")

                # Start ffmpeg process to publish to RTMP/MediaMTX if configured
                ff_proc = None
                if self.ffmpeg_output:
                    ff_proc = self._start_ffmpeg(cap)

                last_time = time.time()
                fps_smooth = 0.0
                frame_idx = 0
                processed = 0
                while self.running and cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        raise RuntimeError("Frame read failed")

                    frame_idx += 1
                    # Skip frames if configured
                    if self.skip_frames and (frame_idx % (self.skip_frames + 1) != 0):
                        continue

                    t0 = time.time()
                    # DNN detection
                    (h, w) = frame.shape[:2]
                    # Load net lazily if not already
                    if self.net is None:
                        try:
                            if cv2 is None:
                                import cv2 as _cv2
                                cv2 = _cv2
                            self.net = cv2.dnn.readNetFromCaffe(self.prototxt, self.model)
                        except Exception as e:
                            print(f"[{self.id}] failed to load DNN model: {e}")
                            self.net = None

                    detections = None
                    if self.net is not None:
                        blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0,
                                                     (300, 300), (104.0, 177.0, 123.0))
                        self.net.setInput(blob)
                        detections = self.net.forward()
                    
                    faces = []
                    if detections is not None:
                        for i in range(0, detections.shape[2]):
                            confidence = float(detections[0, 0, i, 2])
                            if confidence < self.min_confidence:
                                continue
                            box = detections[0, 0, i, 3:7] * [w, h, w, h]
                            (startX, startY, endX, endY) = box.astype('int')
                            faces.append((startX, startY, endX-startX, endY-startY))

                    # Draw overlays
                    for (x,y,w,h) in faces:
                        cv2.rectangle(frame, (x,y), (x+w, y+h), (0,255,0), 2)

                    # FPS calculation
                    dt = t0 - last_time if last_time else 0.016
                    fps = 1.0 / dt if dt > 0 else 0.0
                    fps_smooth = 0.9 * fps_smooth + 0.1 * fps if fps_smooth else fps
                    last_time = t0

                    # Overlay text
                    cv2.putText(frame, f"Camera: {self.id}", (10,20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)
                    cv2.putText(frame, f"FPS: {fps_smooth:.1f}", (10,45), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

                    # Send frame to ffmpeg if running
                    if ff_proc and ff_proc.stdin:
                        try:
                            ff_proc.stdin.write(frame.tobytes())
                        except BrokenPipeError:
                            # ffmpeg died; break to reconnect
                            raise RuntimeError("ffmpeg pipe broken")

                    # On each face detection, create an alert
                    if len(faces) > 0:
                        self._handle_alert(frame, faces)

                    processed += 1
                    if self.max_frames and processed >= self.max_frames:
                        # stop after configured number of frames (useful for smoke tests)
                        self.running = False
                        break

                    # keep processing near-real-time: drop frames if queue gets full
                    time.sleep(0.001)

                # If loop exits normally, cleanup ffmpeg
                if ff_proc:
                    try:
                        ff_proc.stdin.close()
                        ff_proc.wait(timeout=2)
                    except Exception:
                        pass

                backoff = 1.0

            except Exception as e:
                print(f"[{self.id}] stream error: {e}")
                # Exponential backoff
                time.sleep(backoff)
                backoff = min(backoff * 2, max_backoff)

            finally:
                if cap:
                    cap.release()

    def _start_ffmpeg(self, cap):
        # Probe frame size
        # Import cv2 if necessary for constants
        global cv2
        if cv2 is None:
            try:
                import cv2 as _cv2
                cv2 = _cv2
            except Exception:
                # Fallback defaults
                width = 640
                height = 480
                fps = 15
        if 'width' not in locals():
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
            fps = int(cap.get(cv2.CAP_PROP_FPS) or 15)

        cmd = [
            'ffmpeg',
            '-y',
            '-f', 'rawvideo',
            '-pix_fmt', 'bgr24',
            '-s', f'{width}x{height}',
            '-r', str(fps),
            '-i', '-',
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-tune', 'zerolatency',
            '-f', 'flv',
            self.ffmpeg_output
        ]

        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        return proc

    def _handle_alert(self, frame, faces):
        snapshot_url = None
        tmpfile = None
        try:
            # Encode to JPEG
            _, buf = cv2.imencode('.jpg', frame)
            jpg_bytes = buf.tobytes()

            # If S3 enabled, upload and set snapshot_url
            if self.s3_client and self.s3_cfg.get('bucket'):
                key = f"snapshots/{self.id}_{int(time.time())}.jpg"
                try:
                    self.s3_client.put_object(Bucket=self.s3_cfg['bucket'], Key=key, Body=jpg_bytes, ACL='public-read')
                    snapshot_url = (self.s3_cfg.get('public_base_url') or '').rstrip('/') + '/' + key
                except (BotoCoreError, ClientError) as e:
                    print(f"[{self.id}] S3 upload failed: {e}")
            elif self.save_snapshots:
                snapshots_dir = os.path.join(os.getcwd(), 'worker', 'snapshots')
                os.makedirs(snapshots_dir, exist_ok=True)
                fname = f"{self.id}_{int(time.time())}.jpg"
                fpath = os.path.join(snapshots_dir, fname)
                cv2.imwrite(fpath, frame)
                snapshot_url = fpath

            # Build alert payload
            jpg_b64 = base64.b64encode(jpg_bytes).decode('ascii')
            alert = {
                'camera_id': self.id,
                'timestamp': int(time.time()),
                'faces': len(faces),
                'snapshot_b64': jpg_b64,
                'snapshot_url': snapshot_url
            }

            # Publish to MQ if configured
            if self.mq_channel:
                try:
                    body = json.dumps(alert)
                    self.mq_channel.basic_publish(exchange=self.mq_cfg.get('exchange') or '', routing_key=self.mq_cfg.get('routing_key') or '', body=body)
                except Exception as e:
                    print(f"[{self.id}] MQ publish failed: {e}")

            # Also POST to backend API as a fallback/duplicate
            if self.backend_alert_url:
                try:
                    headers = {'Content-Type': 'application/json'}
                    requests.post(self.backend_alert_url, json=alert, timeout=5)
                except Exception as e:
                    print(f"[{self.id}] failed to post alert: {e}")

        finally:
            if tmpfile and os.path.exists(tmpfile):
                try:
                    os.remove(tmpfile)
                except Exception:
                    pass

    def _ensure_dnn_model(self):
        # OpenCV res10 model files (use models config if available)
        base = (self.models_cfg.get('base_url') or '').rstrip('/')
        prototxt_name = self.models_cfg.get('prototxt') or 'deploy.prototxt'
        model_name = self.models_cfg.get('caffemodel') or 'res10_300x300_ssd_iter_140000_fp16.caffemodel'
        prototxt_url = (f"{base}/{prototxt_name}" if base else 'https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt')
        model_url = (f"{base}/{model_name}" if base else 'https://raw.githubusercontent.com/opencv/opencv_3rdparty/master/res10_300x300_ssd_iter_140000_fp16.caffemodel')

        def _download_and_verify(url, dest, expected_sha256=None):
            try:
                tmpfd, tmpname = tempfile.mkstemp()
                os.close(tmpfd)
                urllib.request.urlretrieve(url, tmpname)
                if expected_sha256:
                    sha256 = hashlib.sha256()
                    with open(tmpname, 'rb') as f:
                        for chunk in iter(lambda: f.read(8192), b''):
                            sha256.update(chunk)
                    got = sha256.hexdigest()
                    if got.lower() != expected_sha256.lower():
                        os.remove(tmpname)
                        raise RuntimeError(f"Checksum mismatch for {url}: expected {expected_sha256}, got {got}")
                shutil.move(tmpname, dest)
                return True
            except Exception as e:
                if os.path.exists(tmpname):
                    try:
                        os.remove(tmpname)
                    except Exception:
                        pass
                print(f"Failed to download/verify {url}: {e}")
                return False

        # Fetch prototxt if missing or checksum mismatch
        prototxt_sha = self.models_cfg.get('prototxt_sha256')
        if not os.path.exists(self.prototxt):
            _download_and_verify(prototxt_url, self.prototxt, prototxt_sha)

        # Fetch model if missing or checksum mismatch
        model_sha = self.models_cfg.get('caffemodel_sha256')
        if not os.path.exists(self.model):
            _download_and_verify(model_url, self.model, model_sha)

    def _ensure_mq(self):
        if not self.mq_cfg:
            return
        try:
            params = pika.URLParameters(self.mq_cfg.get('url'))
            self.mq_conn = pika.BlockingConnection(params)
            self.mq_channel = self.mq_conn.channel()
            # Declare exchange if provided
            if self.mq_cfg.get('exchange'):
                self.mq_channel.exchange_declare(exchange=self.mq_cfg.get('exchange'), exchange_type='direct', durable=True)
        except Exception as e:
            print(f"[{self.id}] failed to setup MQ: {e}")
