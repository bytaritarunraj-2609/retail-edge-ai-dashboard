# Store Pulse — Project Continuation File

> **Purpose:** This file is the persistent source of truth for future development, debugging, updates, and AI-assisted coding sessions for the **Store Pulse** project.
>
> **Rule:** Before making changes, read this file and inspect the current repository. Update this file whenever architecture, features, setup, integrations, or important decisions change.

---

## 1. Project Identity

**Project name:** Store Pulse

**Origin:** Retail Edge AI Dashboard / Retail Edge AI SIH project

**Primary goal:** Build a practical retail analytics system where real camera/video input is processed with real YOLO inference, shelf analytics are persisted in SQLite, Flask exposes the resulting data through REST APIs, and the React dashboard visualizes the live state through the Store Map and Shelf Detail UI.

### Core pipeline

```text
Camera / MP4
      ↓
Real YOLO inference
      ↓
ROI / shelf analysis
      ↓
SQLite database
      ↓
Flask REST API
      ↓
LiveIntelligenceAdapter
      ↓
React dashboard
      ↓
Store Map / Shelf Detail
```

---

## 2. Current Development Principle

The project must be a **real working system**, not a mock-only demo.

### Never do these in live mode

- Do not fabricate detections.
- Do not use fake bounding boxes and claim they are YOLO results.
- Do not silently fall back to mock data while live mode is selected.
- Do not invent API endpoints.
- Do not introduce WebSockets for the current Flask backend unless the backend is genuinely changed to support them.
- Do not remove working dashboard features simply to make a build pass.
- Do not hardcode machine-specific paths.
- Do not commit secrets, virtual environments, `node_modules`, or unnecessary generated files.

### Preferred engineering approach

- Preserve working architecture.
- Make changes modular.
- Keep frontend and backend contracts explicit.
- Put backend-to-frontend translation in an adapter/mapping layer.
- Keep mock mode available for UI development.
- Verify runtime behavior, not only compilation.

---

## 3. Final Repository Target

The final self-contained repository should be:

```text
store pulse/
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── index.html
│   └── .env.example
│
├── backend/
│   ├── app.py
│   ├── db.py
│   ├── shelf_analytics.py
│   ├── worker.py
│   ├── yolo_roi.py
│   ├── yolo_test.py
│   ├── requirements.txt
│   └── .env.example
│
├── README.md
├── STORE_PULSE_PROJECT.md
└── .gitignore
```

The exact structure may be adjusted when necessary, but the repository must remain self-contained.

### Do not copy into the final repo

- `node_modules/`
- `.venv/`
- `dist/`
- `__pycache__/`
- `*.pyc`
- `.git/` from old source projects
- temporary agent/task logs
- secrets
- machine-specific caches

---

## 4. Historical Source Projects

The original working code was split across these locations.

### Frontend source

```text
C:\Users\yaswa\OneDrive\Documents\retail-edge-ai-dashboard-main
```

### Current/working backend source

```text
C:\Users\yaswa\OneDrive\Documents\retailedge_dashboard
```

### Other copies found during investigation

```text
C:\Users\yaswa\OneDrive\Documents\retail edge ai\gpt dash\retailedge_dashboard
C:\Users\yaswa\OneDrive\Documents\retail edge ai\gpt dash\retailedge_dashboard_backup
C:\Users\yaswa\OneDrive\Documents\retail edge ai\RetailEdge-SIH-main
```

The root `retailedge_dashboard` folder was identified as the current backend.

**Important:** Store Pulse should eventually stop depending on any of these old paths.

---

## 5. Frontend Stack

- React
- Vite
- TypeScript
- Existing CSS/design system
- Existing Store Map and dashboard components

### Key frontend areas

- Overview
- Store Map
- Shelf Panel
- Shelf Detail Drawer
- Camera resource summary
- Camera scheduling
- KPIs
- Footfall charts
- Events/actions
- Settings
- Manager mode
- Mock/live intelligence source switching

### Important frontend files

```text
src/hooks/useIntelligence.ts
src/hooks/useCameraScheduler.ts

src/adapters/MockIntelligenceAdapter.ts
src/adapters/LiveIntelligenceAdapter.ts

src/types/index.ts

src/components/store-map/StoreMap.tsx
src/components/store-map/ShelfPanel.tsx
src/components/store-map/ShelfDetailDrawer.tsx
src/components/store-map/WebcamShelfPrototype.tsx
src/components/store-map/CameraResourceSummary.tsx
src/components/store-map/SharedStoreLayout.tsx
```

---

## 6. Live Data Architecture

The actual backend is REST-based.

### No WebSocket

The Flask backend currently does **not** use WebSockets or Flask-SocketIO.

The live frontend therefore uses REST polling.

### Live flow

```text
React
  ↓
LiveIntelligenceAdapter
  ↓  fetch()
Flask REST API
  ↓
SQLite
```

### Polling behavior

Target behavior:

- poll approximately every 3 seconds
- perform an immediate first request
- avoid overlapping requests
- clean up the polling interval when unsubscribed/unmounted
- handle temporary backend failures gracefully
- do not silently switch to mock data in live mode

---

## 7. Backend

### Backend framework

Flask

### Database

SQLite

### Base URL

```text
http://127.0.0.1:5000
```

### Existing API routes

```text
GET  /api/dashboard
GET  /api/shelf-status
GET  /api/shelf-events
GET  /api/tasks
POST /api/tasks/<int:task_id>/status
GET  /api/health
```

### CORS

Allowed development origins:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Current approach uses Flask-CORS rather than a Vite proxy.

---

## 8. Backend Data vs Frontend Data

The backend is centered around:

```text
metrics
chart
shelf_status
events
tasks
```

Shelf data currently includes fields such as:

```text
shelf_id
bottle_count
stock_status
misplaced_objects
average_confidence
timestamp
```

The frontend expects a richer `DashboardData` structure, including:

```text
footfallPresent
footfallDay
footfallWeek
actions
cameras
shelves
team
counters
queue
kpis
```

### Mapping layer

The adapter translates backend responses into the existing frontend types.

Typical mapping:

```text
metrics        → KPIs
chart          → footfallDay
shelf_status   → Shelf[]
events         → Action[]
tasks          → Action[]
```

For shelves:

```text
shelf_id              → id
bottle_count          → stock
stock_status          → frontend status
misplaced_objects     → insight/details
average_confidence    → confidence-related UI
```

### Status mismatch

Backend analytics uses:

```text
AVAILABLE
OUT_OF_STOCK
```

Frontend uses:

```text
NORMAL
RESTOCK
OUT_OF_STOCK
MISPLACED
```

Known mapping:

```text
AVAILABLE → NORMAL
```

Do not invent a RESTOCK/MISPLACED status unless the backend actually provides enough evidence to derive it.

---

## 9. Shelf Analytics

Important discovery from the existing backend:

`ShelfAnalytics.update()` expects misplaced objects in a structure such as:

```python
[{"name": "cup"}]
```

not:

```python
["cup"]
```

Its analytics data also uses:

```text
AVAILABLE
OUT_OF_STOCK
```

Future changes must respect the real method signature and data contract.

---

## 10. YOLO Worker

The backend contains:

```text
yolo_roi.py
yolo_test.py
shelf_analytics.py
worker.py
```

A dedicated `worker.py` was created to provide a clearer configurable inference process.

### Worker responsibilities

1. Initialize SQLite.
2. Load the real YOLO model.
3. Open webcam or video source.
4. Process frames.
5. Apply shelf ROI logic.
6. Count bottles.
7. Record misplaced object classes.
8. Calculate confidence.
9. Update `ShelfAnalytics`.
10. Persist shelf status to SQLite.
11. Persist shelf events to SQLite.
12. Optionally display an OpenCV HUD/window.

### Model

Intended model:

```text
YOLO11n
```

Use the actual existing/project-intended model configuration when available.

Do not replace it with a dummy detector.

### Source configuration

The worker should support:

```text
YOLO_SOURCE=0
```

for webcam, and:

```text
YOLO_SOURCE=C:/path/to/video.mp4
```

for an MP4 source.

Never hardcode a user-specific path.

### Example backend environment

```env
YOLO_MODEL_PATH=yolo11n.pt
YOLO_SOURCE=0
DB_SAVE_INTERVAL=3
HEADLESS=1
```

Use a local `.env` for machine-specific values, and keep `.env` out of Git.

---

## 11. YOLO ROI

The worker currently uses a normalized rectangular ROI concept roughly equivalent to:

```text
left   = 25% width
top    = 20% height
right  = 75% width
bottom = 80% height
```

The ROI is used to decide which detections count toward shelf analytics.

Future improvements should prefer configurable ROI per camera/shelf rather than hardcoded assumptions.

---

## 12. Store Map Requirement

The Store Map is a central product feature.

When a user clicks a shelf/camera, the Shelf Detail Drawer should expose real information.

### Desired shelf detail

- Shelf ID
- Camera ID
- Zone
- Current status
- Bottle/object count
- Misplaced objects
- Detection count when available
- Tracking count when available
- Confidence when available
- Last analysis
- Relevant event
- Camera processing state

### User should understand this chain

```text
Camera
  ↓
YOLO
  ↓
Detection
  ↓
Shelf Analysis
  ↓
Database
  ↓
Store Map Result
```

The Store Map must not look like a disconnected decorative mock.

If annotated video/frames can genuinely be supplied by the backend, display them.

If the backend remains API/database-only, display the most recent real inference results and clearly represent camera/source state.

---

## 13. Camera Scheduler

The original dashboard concept intentionally limits simultaneously processed cameras (historically 4 active cameras).

Preserve the existing scheduler concept unless real system constraints require a change.

Camera states include:

```text
INACTIVE
QUEUED
PROCESSING
CAPTURING
ANALYZING
COMPLETE
```

Do not make all cameras appear active when only a subset is actually being processed.

---

## 14. WebcamShelfPrototype

The component was recreated and then enhanced.

Desired responsibilities:

- browser webcam access where applicable
- camera permission handling
- graceful "permission denied" behavior
- stream cleanup on unmount/close
- display actual latest shelf/YOLO analysis information
- use selected camera/shelf context correctly

Avoid presenting a fake live feed as though it were backend YOLO output.

---

## 15. Environment Configuration

### Frontend

Mock:

```env
VITE_INTELLIGENCE_SOURCE=mock
```

Live:

```env
VITE_INTELLIGENCE_SOURCE=live-test
```

Backend API:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

Do not use the old WebSocket variable for the actual Flask backend.

### Backend

Use environment variables for:

- YOLO model path
- YOLO source
- database path when useful
- save interval
- headless mode

---

## 16. Python Environment Decision

The original environment showed Python 3.13 + NumPy/OpenCV/Ultralytics compatibility problems.

Observed failure included:

```text
ModuleNotFoundError:
No module named 'numpy._core._multiarray_umath'
```

There was also a PyTorch/Windows DLL-related problem during repair attempts.

### Final recommendation

Use a clean Python 3.11 environment for Store Pulse:

```text
store pulse/backend/.venv
```

Do not make the old:

```text
retailedge_dashboard/.venv
```

a dependency of the final project.

Verify:

```powershell
python --version
python -c "import numpy; print(numpy.__version__)"
python -c "import cv2; print(cv2.__version__)"
python -c "import ultralytics; print('ultralytics OK')"
```

Also verify PyTorch if required by the installed Ultralytics stack.

---

## 17. Current Known Verification Status

### Already completed / established

- React frontend architecture exists.
- Missing frontend imports were recreated.
- Flask backend was identified.
- REST API routes were verified.
- React-to-Flask integration was implemented.
- CORS was added.
- Live adapter uses REST polling.
- Backend/frontend mapping exists.
- `npm run build` passed after the frontend integration.
- Mock mode is preserved.
- YOLO worker code was created/updated.
- ShelfAnalytics API mismatches were found and corrected.
- Shelf Detail and webcam/camera UI were updated.

### Not fully proven yet

The following still require genuine runtime verification in the final Store Pulse repository:

```text
Real YOLO model loads
Real video/webcam opens
Frames are processed
Real detections are generated
SQLite changes from new inference
Flask API changes from new inference
React receives those changes
Store Map updates from those changes
Real inference information is visible in Store Map
```

Do not claim "fully working end-to-end" until these are demonstrated.

---

## 18. Final End-to-End Acceptance Test

The system is complete when this chain is verified:

```text
VIDEO / WEBCAM
      ↓
YOLO MODEL
      ↓
REAL DETECTIONS
      ↓
SHELF ANALYTICS
      ↓
SQLITE UPDATED
      ↓
FLASK API UPDATED
      ↓
REACT POLLING RECEIVES UPDATE
      ↓
STORE MAP UPDATES
      ↓
SHELF DETAIL SHOWS RESULT
```

### Acceptance checklist

- [ ] Store Pulse repository is self-contained
- [ ] Frontend installs
- [ ] Frontend build passes
- [ ] Backend installs
- [ ] Flask starts
- [ ] All required API routes respond
- [ ] CORS works
- [ ] Clean Python environment works
- [ ] NumPy works
- [ ] OpenCV works
- [ ] Ultralytics works
- [ ] PyTorch works if required
- [ ] Real YOLO model loads
- [ ] Webcam or valid MP4 opens
- [ ] Frames process continuously
- [ ] Real detections are produced
- [ ] SQLite receives updated results
- [ ] Flask returns updated values
- [ ] React receives changed values
- [ ] Store Map reflects changed values
- [ ] Shelf Detail reflects real results
- [ ] No fake live fallback
- [ ] Mock mode works
- [ ] README is complete
- [ ] Git repo initialized
- [ ] GitHub repo is `store-pulse`
- [ ] Secrets are excluded
- [ ] Working tree is clean

---

## 19. Git / GitHub Plan

### Local repository

```text
C:\Users\yaswa\OneDrive\Documents\store pulse
```

### GitHub repository

Recommended:

```text
store-pulse
```

### Suggested first commit

```text
Initial Store Pulse working product
```

### Important Git rules

Do not commit:

```text
.env
.venv/
node_modules/
dist/
__pycache__/
*.pyc
*.log
```

Avoid committing huge model weights if they exceed normal GitHub limits. Document model acquisition/setup in the README instead.

Do not push to the old repository:

```text
retail-edge-ai-dashboard
```

---

## 20. Development Workflow for Future Updates

Every future AI-assisted session should follow this order:

### Step A — Read this file

Understand:
- architecture
- current status
- constraints
- known limitations
- environment rules

### Step B — Inspect current repository

Never assume this file perfectly matches reality.

Compare it with actual files.

### Step C — Make the smallest safe change

Preserve:
- working UI
- API contract
- mock mode
- real data flow
- existing terminology

### Step D — Test immediately

Use the appropriate checks:
- frontend build
- backend startup
- API requests
- YOLO runtime
- end-to-end test

### Step E — Update this file

After meaningful changes update:
- current architecture
- files changed
- new dependencies
- known limitations
- test results
- next priorities
- decisions

---

## 21. Change Log

### Initial project phase

- Retail Edge AI dashboard was built as React/Vite/TypeScript.
- Store Map, camera scheduler, mock intelligence, KPIs, events and manager settings were added.

### Integration phase

- Missing `LiveIntelligenceAdapter.ts` was recreated.
- Missing `WebcamShelfPrototype.tsx` was recreated.
- Actual Flask backend was discovered.
- WebSocket assumption was removed.
- REST polling adapter was implemented.
- Backend data was mapped into the frontend `DashboardData` model.
- CORS was added.
- Flask API was verified from the terminal.
- Frontend build passed.

### YOLO phase

- YOLO worker was created/updated.
- Configurable webcam/MP4 input was added.
- ShelfAnalytics integration was corrected.
- Backend status mapping was corrected.
- Shelf Detail and camera UI were updated.
- Python/NumPy/OpenCV/PyTorch environment problems were discovered.
- Full real inference → DB → API → React → Store Map verification remains outstanding.

### Store Pulse phase

- New target project/repository name: **Store Pulse**
- New GitHub repository target: **store-pulse**
- Final migration should combine frontend + backend into one self-contained repository.
- A clean Python 3.11 backend environment is preferred.

---

## 22. Future Improvement Backlog

Use this section for future ideas. Do not automatically implement them; prioritize them based on the current product goal.

### Priority 1 — Finish real pipeline

- [ ] Prove real YOLO inference in the final Store Pulse environment.
- [ ] Prove fresh SQLite updates.
- [ ] Prove fresh Flask responses.
- [ ] Prove React live updates.
- [ ] Prove Store Map updates.

### Priority 2 — Better camera experience

- [ ] Real annotated frame/video feed in Shelf Detail if technically appropriate.
- [ ] Per-camera input configuration.
- [ ] Better camera state synchronization.
- [ ] Better error/reconnection indicators.

### Priority 3 — Better shelf intelligence

- [ ] Per-shelf ROI configuration.
- [ ] Better stock estimation.
- [ ] Better misplaced-product rules.
- [ ] Historical shelf trends.
- [ ] Event severity improvements.

### Priority 4 — Product polish

- [ ] Better onboarding/demo mode.
- [ ] Cleaner README and deployment guide.
- [ ] Better loading/error states.
- [ ] Production configuration.
- [ ] Hardware/edge-device deployment path.

---

## 23. AI Coding Agent Instructions

When handing this project to another AI coding agent, start with:

> Read `STORE_PULSE_PROJECT.md` first. Treat it as the project's persistent context, but verify important claims against the actual repository. Do not start from scratch. Preserve working architecture. The live backend is Flask + SQLite + REST. Do not invent WebSocket routes. Do not silently use mock data in live mode. Real YOLO inference must remain the source of live shelf analytics. Make changes incrementally, run validation, and update `STORE_PULSE_PROJECT.md` after meaningful changes.

### Especially important

Before changing:
- API routes
- data structures
- YOLO worker
- Store Map
- live adapter
- database schema

inspect the existing implementation first.

---

## 24. Current Next Best Action

The immediate priority is:

```text
Migrate/finish Store Pulse
        ↓
Create clean backend Python 3.11 environment
        ↓
Verify YOLO + OpenCV + PyTorch + Ultralytics
        ↓
Run real YOLO worker
        ↓
Confirm SQLite updates
        ↓
Confirm Flask updates
        ↓
Confirm React live updates
        ↓
Confirm Store Map result
        ↓
Run final build/tests
        ↓
Initialize new Git repo
        ↓
Create/push GitHub store-pulse
```

Do not spend time on cosmetic redesign before the real pipeline is verified.

---

## 25. Session Notes

**Last known major state:** Frontend ↔ Flask REST integration works and frontend build passes. YOLO worker code exists, but the complete real YOLO end-to-end flow still needs final verification in the Store Pulse repository.

**Most important success criterion:** Real source → YOLO → SQLite → Flask → React → Store Map.

**Project rule:** A successful `npm run build` is necessary but is NOT sufficient proof that Store Pulse is fully working.

---

## 26. File Maintenance Rule

This document itself is part of the project.

Whenever a future session:
- changes architecture
- changes API contracts
- changes dependencies
- fixes a major bug
- adds a major feature
- changes how YOLO works
- changes deployment
- finishes a previously unverified requirement

update this file before ending the session.

Keep the document factual. Separate:
- verified behavior
- planned behavior
- assumptions
- unresolved blockers

Never mark a feature complete unless it has been tested or otherwise conclusively verified.
