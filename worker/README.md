# Worker — Multi-camera Face Detection

This Python worker manages multiple camera streams, runs face detection, overlays camera metadata on frames, publishes processed video to MediaMTX via ffmpeg (RTMP), and emits alerts to a backend or message queue. It's designed for reliability (reconnect/backoff, frame skipping) and testability (local S3/MQ mocks, test video mode).

Files
- `main.py` — starts the worker and loads `worker/config.sample.json` (or use `WORKER_CONFIG` env var)
- `camera_worker.py` — per-camera thread: RTSP reading, OpenCV DNN detection, overlays, streaming, alert publishing
- `mocks.py` — lightweight local mocks for S3 and MQ (used in CI/tests)
- `requirements.txt` — Python dependencies
- `tests/test_smoke.py` — pytest smoke test that runs a camera worker against a short local video and uses mocks

Key features
- OpenCV DNN face detector (res10 SSD) with lazy loading and auto-download of model files.
- SHA-256 verification for model files — configure trusted `models.base_url` and provide checksum values in the config to ensure integrity.
- Streaming processed frames to MediaMTX (RTMP) via `ffmpeg` subprocess.
- On-detection alerts: publish to MQ (RabbitMQ via `pika`) and POST to backend API as fallback.
- Optional snapshot uploads to S3 (or local mock S3) and inclusion of the public snapshot URL in alert payloads.
- Reconnect with exponential backoff and configurable frame skipping to keep processing near real-time.

Configuration (worker/config.sample.json)
- cameras: list of cameras — each camera may include:
  - `id`, `rtsp`, `ffmpeg_output`, `save_snapshots` (bool), `test_video` (local video file for tests), `max_frames` (stop after N frames for smoke tests)
- `backend_alert_url`: optional HTTP API to POST alerts
- `s3`: S3 settings (enabled, bucket, keys, public_base_url)
- `models`: model download settings
  - `base_url` — your trusted model hosting base URL
  - `prototxt` / `caffemodel` — filenames
  - `prototxt_sha256` / `caffemodel_sha256` — hex SHA-256 checksums (recommended)
- `mq`: message queue settings (type, url, exchange, routing_key)
- `local_mocks`: testing flags
  - `use_mock_s3`: true to use local mock S3 client
  - `use_mock_mq`: true to use in-memory mock MQ

Running locally
1. Create a virtual env and install dependencies:

```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r worker\requirements.txt
```

2. Edit `worker\config.sample.json` (or copy it to `worker/config.json` and set `WORKER_CONFIG`) to configure cameras, backend, S3, MQ, and model host/checksums.

3. Run the worker:

```cmd
python worker\main.py
```

Testing (smoke test)
- The repository includes `worker/tests/test_smoke.py` which creates a tiny synthetic video, runs a `CameraWorker` against it in `test_video` mode, and uses the local mocks for S3 and MQ so no external services are required.
- Run the smoke test (it will skip if `cv2` is not available or incompatible in your environment):

```cmd
.venv\Scripts\activate
python -m pytest -q worker/tests/test_smoke.py -q
```

Notes and best practices
- Model hosting and checksums: host the model files (`deploy.prototxt` and the caffemodel) on a trusted server and add the SHA-256 sums to the `models.*_sha256` fields. The worker will download and verify them before using the model.
- Binary compatibility: OpenCV and NumPy must be ABI-compatible. If you see import or runtime errors for `cv2`/`numpy`, ensure both packages are installed with compatible wheel versions (you may need to pin `numpy<2` or use a matching `opencv-python-headless` wheel).
- Production readiness: Consider replacing the FFmpeg/RTMP path with a direct WebRTC pipeline or using MediaMTX WebRTC endpoints for lower-latency publishing.
- Alert reliability: For production, use a persistent message queue (RabbitMQ/Redis) configured without `local_mocks` and ensure the backend verifies alerts and snapshots.

Troubleshooting
- Pylance/Pyright missing-imports: If your editor reports missing imports for optional packages (like `boto3` or `pika`), either install the packages in your dev environment or accept the intentional type-ignore markers in the code — they are optional runtime dependencies.
- Tests skipping: The smoke test will skip on environments where OpenCV cannot be imported due to incompatible binary wheels; use a CI job with pinned wheels or a Docker image that includes compatible OpenCV if end-to-end testing is required.

Contact / next steps
- If you'd like, I can:
  - Add a Dockerfile for a reproducible environment with correct OpenCV/numpy wheels for CI.
  - Add assertions to `test_smoke.py` that inspect the mock S3/MQ to verify alerts were produced and snapshots saved.
  - Swap the DNN model to an ONNX-based detector and update downloading/verification accordingly.
Worker for multi-camera face detection

Files
- `main.py` - starts the worker and loads `config.sample.json` (or use `WORKER_CONFIG` env var)
- `camera_worker.py` - per-camera thread that reads RTSP with OpenCV, runs Haar face detection, overlays, streams via ffmpeg to MediaMTX, and posts alerts to backend.
- `requirements.txt` - python deps

How it works
- Each camera spawns a thread which opens the RTSP stream with OpenCV.
- Frames are decoded and faces detected using OpenCV Haar cascade.
- Detected faces trigger an alert POST to `backend_alert_url` with a base64 JPEG snapshot.
- Processed frames are sent to MediaMTX via ffmpeg (stdin pipe -> RTMP publish).
- On failure, the worker reconnects with exponential backoff.
- You can enable saving snapshots with `save_snapshots` per-camera in the config.

Run

1. Create a virtual env and install deps:

```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r worker\requirements.txt
```

2. Edit `worker\config.sample.json` and set your cameras and backend URL. Then run:

```cmd
python worker\main.py
```

Notes and next steps
- The worker uses Haar cascades (fast, low-accuracy). Swap to a DNN-based detector for better results (e.g., OpenCV DNN or a dedicated library like go-face equivalent).
- For production, convert the ffmpeg streaming to direct WebRTC or use MediaMTX API.
- Consider switching alert posting to a message queue for reliability.
