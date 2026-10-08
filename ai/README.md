# Retail Edge AI Prototype

This directory contains the standalone AI prototype for the Retail Edge dashboard.

## Overview
This prototype uses YOLO11n coupled with **ByteTrack** for persistent object tracking, **Zone Analytics** for spatial mapping, and **Retail Intelligence** for telemetry aggregation. We are focusing initially on **PERSON detection** (class 0).

## Environment Setup
It is recommended to use a local Python virtual environment to run this prototype.

1. **Create the virtual environment**:
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment**:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Zone Configuration & Mapping
The AI prototype conceptualizes the view space into a 5x4 grid, creating 20 unique tracking zones (`Z01` to `Z20`) using normalized coordinates (0.0 to 1.0). 
- **Mapping Process**: For each tracked person, their bounding box center `(cx, cy)` is computed and normalized relative to the frame. The tracker then determines exactly which configured zone contains that point and assigns it accordingly.
- **Activity Level Heuristic**: A simple prototype heuristic determines activity. E.g., `LOW` (0), `MEDIUM` (1-2), `HIGH` (3+).
- **Dwell Time**: Calculated deterministically based on entry and exit timestamps (or the current simulated timestamp if they haven't left).

## Running Inference & Intelligence Pipeline
The inference script uses the Ultralytics built-in ByteTrack tracker, dynamically generates zone analytics, and immediately aggregates this data into a structured Retail Telemetry schema.

```bash
python inference/yolo_detector.py --source samples/test.mp4 --track --save-video
```

**Expected Input**: Local video files (`.mp4`).

### 3. Start the Live Shelf Webcam Prototype (Camera 03)

If you want to use the live webcam prototype for Camera 03:

```bash
cd ai
pip install -r requirements.txt
python stream/server.py
```
This will start a FastAPI WebSocket server on `ws://localhost:8000/ws/shelf`. In the React dashboard, navigate to **Store Map**, click on **Camera 03**, and click **LAUNCH SHELF CAM PROTOTYPE**.

**Limitations & Notes:**
- Camera 03 is the ONLY physical prototype. All other cameras remain simulated.
- YOLO11n COCO model is used. The expected product is hardcoded as `bottle`.
- COCO does not distinguish between water/Coke/Pepsi bottles.
- The ROI uses normalized coordinates (0.0 to 1.0) and requires a 15% intersection over the bounding box area to register.
- Partial-object detection depends entirely on YOLO visibility and confidence.
- Other detected COCO classes inside the ROI are marked "potentially misplaced."
- The detected-object count is NOT a persistent inventory count across frames (yet).

**Expected Output**: 
- `outputs/zone_tracking_test.json`: Frame-by-frame tracked objects.
- `outputs/zone_activity_test.json`: Zone summary statistics.
- `outputs/zone_transitions_test.json`: A log of every observed zone boundary crossing.
- `outputs/retail_intelligence_test.json`: The final unified telemetry schema (summary, zone metrics, customer flow edges, and occupancy snapshots).
- `outputs/annotated_zone_test.mp4`: An annotated verification video.

**Important Telemetry Note**:
The data inside `retail_intelligence_test.json` is clearly labeled as `test_video` and `isDemo=True`. This telemetry represents *observed* tracking from a test video, not live store footfall or actual live traffic. The Intelligence module simply aggregates raw computer-vision metrics; it does not infer intent or artificially invent live measurements.

## Troubleshooting & Limitations
- **CPU/GPU**: By default, `ultralytics` will utilize a GPU/CUDA if available. The prototype also fully supports CPU execution for testing, although inference FPS will be considerably lower.
- **Lost Tracks**: ByteTrack handles track persistence internally. A track is not immediately lost if a frame misses it, ensuring stable tracking.
- **Determinism**: The zone bounds, transition mapping, and simulated timestamps are entirely deterministic per video. 

## Note on Dashboard Integration
The React dashboard is entirely decoupled from this AI prototype. Currently, the dashboard uses a Mock simulation. They will be integrated in future steps via the `LiveIntelligenceAdapter`.
