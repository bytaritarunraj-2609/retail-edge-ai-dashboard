# Retail Edge AI

Retail Edge AI is an edge-computing based intelligent retail analytics prototype for real-time shelf intelligence, store analytics, camera resource optimization, and retail decision support.

## Project Status

Current milestone:
**Dashboard + Shelf Camera AI Prototype**

Implemented:
- Premium React dashboard
- Liquid Glass UI system
- Overview intelligence dashboard
- Store Map
- 20 shelf zones
- 20 shelf cameras
- 4-camera active scheduling simulation
- Inventory intelligence
- Team management
- Footfall and queue intelligence
- Heatmap visualization
- Manager / Worker modes
- Settings and notifications
- Mock intelligence adapter architecture
- Real local YOLO11n shelf-camera prototype
- Flexible four-point ROI
- ROI lock/unlock/reset
- Per-camera ROI persistence
- Registered product detection
- Misplaced product detection
- Camera intelligence HUD

*Note on mock vs real functionality:*
- Dashboard analytics are currently prototype/mock-driven.
- Shelf camera prototype uses real local YOLO11n inference.
- Counter-video person tracking and ByteTrack are NOT yet integrated.

## Architecture

Camera
↓
Edge Device
↓
YOLO11n Detection
↓
ByteTrack Tracking
↓
Analytics
↓
Retail Intelligence
↓
Dashboard

The current implementation is being developed incrementally. The live AI adapter will eventually replace the mock adapter entirely without requiring a rewrite of the UI layer.

## Current Technology Stack

Frontend:
- React
- TypeScript
- Vite
- Vanilla CSS / CSS variables
- Motion / Framer Motion
- Recharts
- Lucide React

AI prototype:
- Python
- OpenCV
- Ultralytics YOLO11n
- Local inference

Architecture:
- Adapter-based intelligence layer
- MockIntelligenceAdapter
- modular React components
- project-specific Antigravity plugin rules

## Dashboard Modules

1. **Overview**: High-level aggregated statistics and health metrics for the store.
2. **Store Map**: Interactive floor plan visualizing shelf zones, active cameras, and live detection overlays.
3. **Inventory**: Mock stock levels and misplaced-item intelligence dashboard.
4. **Team**: Staff assignments, roles, and shift coverage tracking.
5. **Footfall**: Customer queue analytics and general movement volume mock data.
6. **Heatmap**: Visualization of customer dwell times and high-traffic zones.
7. **Settings**: Role toggles (Manager/Worker) and system-level configuration.

## Shelf Camera Prototype

The current real-camera prototype operates using the following pipeline:

Camera
→ Raw frame
→ YOLO11n
→ Detection
→ ROI filtering
→ Registered / misplaced object classification
→ Shelf intelligence

Key features of the prototype:
- Four draggable ROI points to map the exact shelf region.
- Transparent quadrilateral rendering explicitly showing the active ROI.
- Dynamic ROI state colors (Red: Empty, Green: Healthy, Orange: Misplaced).
- Registered bottle detection via YOLO.
- Misplaced retail-product detection based on shelf configuration.
- Graceful person/non-product filtering so non-inventory items are ignored.
- Sleek camera HUD with live detection readouts.
- Fully local inference.

*(Note: ByteTrack tracking is not yet implemented in this phase.)*

## Camera Resource Optimization

The dashboard currently simulates camera scheduling:
- 20 total cameras
- 4 active at a time
- Deterministic priority queue
- Activity-based scheduling
- Camera lifecycle simulation

This optimizes edge-device processing capacity by only performing full inference on high-priority zones. *(Currently simulated behavior.)*

## Development Philosophy

- Prototype quickly, architect cleanly.
- UI independent from AI implementation.
- Mock data must never be presented as real inference.
- AI integration should happen through adapters.
- Preserve working features when adding new intelligence.
- Local-first development.
- No unnecessary cloud/database dependency.

## Roadmap

- [x] Dashboard foundation
- [x] Liquid Glass UI
- [x] Overview
- [x] Store Map
- [x] Inventory
- [x] Team
- [x] Footfall / Queue Intelligence
- [x] Heatmap
- [x] Mock intelligence adapter
- [x] Real YOLO11n shelf-camera prototype
- [x] Flexible ROI
- [x] Registered / misplaced object prototype

- [x] Real ByteTrack integration
- [x] Real person tracking
- [x] Counter-video analytics
- [x] Queue analytics from real footage
- [x] Dwell-time analytics
- [x] Real customer movement heatmap
- [x] Live AI adapter
- [x] Edge-device deployment
- [x] Final YOLO model integration

## Running the Dashboard

```bash
npm install
npm run prod
```

The dashboard will be available at:
`http://localhost:5173`

## Running the AI Prototype

Ensure you have a Python environment set up. If using the provided `.venv`:

```bash
cd ai
# Activate your environment (e.g., .venv\Scripts\activate on Windows)
python stream/server.py
```

## Project Structure

```
retail-edge-dashboard/
├── ai/
│   ├── inference/
│   ├── intelligence/
│   ├── outputs/
│   ├── samples/
│   ├── stream/
│   ├── server.py (or via stream/server.py)
│   └── requirements.txt
├── src/
│   ├── adapters/
│   ├── components/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── styles/
│   ├── types/
│   └── utils/
├── .gitignore
├── package.json
└── tsconfig.json
```

## Important Notes

- Dashboard demo values are not production AI inference.
- YOLO11n currently runs locally.
- Camera/ROI prototype is experimental.
- Real counter analytics are the next development phase.


