# AI Prototype Architecture

## CURRENT ARCHITECTURE

Currently, the React dashboard uses a `MockIntelligenceAdapter` to simulate detections, footfall, and shelf events. The AI prototype is a separate standalone system being developed alongside it.

VIDEO
 ↓
YOLO11n
 ↓
DETECTIONS
 ↓
ByteTrack
 ↓
TRACKED OBJECTS
 ↓
ZONE MAPPING
 ↓
DWELL TIME
 ↓
RETAIL INTELLIGENCE
 ↓
STRUCTURED RETAIL TELEMETRY
 ↓
LIVE INTELLIGENCE ADAPTER
 ↓
DASHBOARD DATA

## 2. SHELF CAM PROTOTYPE (NEW)

DASHBOARD CAMERA 03 acts as a live, real-time edge AI shelf prototype using WebRTC and Python WebSockets.

LOCAL WEBCAM (React `getUserMedia`)
 ↓ Base64 frames via WebSocket (10 FPS)
Python FastAPI (`ai/stream/server.py`)
 ↓
YOLO11n (COCO classes)
 ↓ JSON Detections
React Dashboard (ROI Editor + Bounding Box intersection)
 ↓
Shelf Status (STOCK AVAILABLE / NO STOCK)

## FUTURE ARCHITECTURE

Once the AI prototype is mature (including inventory recognition and queue detection), it will be integrated with the dashboard through a `LiveIntelligenceAdapter`.

Camera
   ↓
Frame Selection
   ↓
YOLO11n
   ↓
Detections
   ↓
ByteTrack
   ↓
Tracked Objects
   ↓
Zone Analytics
   ↓
Retail Intelligence
   ↓
LiveIntelligenceAdapter
   ↓
Dashboard

*Note: Retail Intelligence does not perform detection itself. It aggregates measurements produced by the computer-vision pipeline into structured telemetry (e.g. occupancy snapshots, customer flow edges). The dashboard's `MockIntelligenceAdapter` remains active until the live adapter is fully ready. The current zone coordinates are prototype normalized coordinates and will later be calibrated to the physical store/camera layout.*
