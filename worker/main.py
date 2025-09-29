import json
import os
import signal
import sys
from camera_worker import CameraWorker


def load_config(path):
    with open(path, 'r', encoding='utf-8') as f:
        cfg = json.load(f)
    return cfg


def main():
    cfg_path = os.environ.get('WORKER_CONFIG', os.path.join(os.getcwd(), 'worker', 'config.sample.json'))
    cfg = load_config(cfg_path)

    cameras = cfg.get('cameras', [])
    backend_url = cfg.get('backend_alert_url')
    detection_cfg = cfg.get('detection', {})
    s3_cfg = cfg.get('s3') or {}
    mq_cfg = cfg.get('mq') or {}

    workers = []
    for cam in cameras:
        cam_cfg = {
            'id': cam.get('id'),
            'rtsp': cam.get('rtsp'),
            'test_video': cam.get('test_video', '') or '',
            'max_frames': cam.get('max_frames', 0) or 0,
            'ffmpeg_output': cam.get('ffmpeg_output'),
            'save_snapshots': cam.get('save_snapshots', False),
            'backend_alert_url': backend_url,
            's3': s3_cfg,
            'mq': mq_cfg,
            'min_confidence': detection_cfg.get('min_confidence', 0.5),
            'skip_frames': detection_cfg.get('skip_frames', 0)
        }
        w = CameraWorker(cam_cfg)
        workers.append(w)

    def _sigint(n, f):
        print('Shutting down...')
        for w in workers:
            w.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, _sigint)
    signal.signal(signal.SIGTERM, _sigint)

    for w in workers:
        w.start()

    # Keep main alive
    try:
        while True:
            signal.pause()
    except KeyboardInterrupt:
        _sigint(None, None)


if __name__ == '__main__':
    main()
