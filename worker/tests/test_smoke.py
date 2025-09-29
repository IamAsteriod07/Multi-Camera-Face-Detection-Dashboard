import os
import os
import sys
import time
import numpy as np

# Make sure the worker package path is importable when pytest runs from project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    import cv2
except Exception:
    cv2 = None

from camera_worker import CameraWorker


def test_worker_smoke(tmp_path):
    if cv2 is None:
        import pytest
        pytest.skip("OpenCV not available in this environment")
    # Create a short synthetic video
    video_path = str(tmp_path / 'short.avi')
    width, height = 320, 240
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(video_path, fourcc, 5, (width, height))
    for i in range(10):
        frame = (255 * (i % 2)) * np.ones((height, width, 3), dtype='uint8')
        out.write(frame)
    out.release()

    cam_cfg = {
        'id': 'testcam',
        'rtsp': '',
        'test_video': video_path,
        'max_frames': 5,
        'ffmpeg_output': '',
        'save_snapshots': False,
        'backend_alert_url': '',
        'min_confidence': 0.2,
        'skip_frames': 0,
        's3': {'enabled': False, 'bucket': 'test-bucket'},
        'mq': {},
        'local_mocks': {'use_mock_s3': True, 'use_mock_mq': True},
    }

    worker = CameraWorker(cam_cfg)
    worker.start()
    # Wait until worker stops (max timeout)
    timeout = time.time() + 10
    while worker.is_alive() and time.time() < timeout:
        time.sleep(0.1)

    # If worker is still alive, attempt to stop
    worker.stop()
    worker.join(timeout=2)

    assert not worker.is_alive()
