# RetailEdge AI Dashboard — beginner starter

A Flask + SQLite + HTML/CSS/JavaScript prototype for the RetailEdge AI project.

## Two modes
- **Manager:** store KPIs, footfall, wait time, stockout alerts, shelf availability, trend charts, live edge status and operational alerts.
- **Worker:** next action, queue status, priority alerts and actionable tasks.

## Current limitation
The database contains **sample data**. It is not yet connected to your real YOLO, ByteTrack, shelf-camera, CCTV or IQ-9075 pipeline.

## Folder structure
```text
retailedge_dashboard/
├── app.py
├── db.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

`retailedge.db` is created automatically the first time the app starts.

## Run it in VS Code — Windows

1. Install Python 3.11+.
2. Open this folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
5. Open `http://127.0.0.1:5000` in Chrome.

If PowerShell blocks activation, use:
```bash
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

## Architecture
```text
CCTV / Shelf Cameras / AI pipeline
                ↓
          Flask backend
                ↓
          SQLite database
                ↓
          REST API (/api/...)
                ↓
       HTML + CSS + JavaScript
                ↓
     Manager mode / Worker mode
```

## Next step for your real prototype
Replace the seeded sample values with real events from your RetailEdge pipeline:

### CCTV / queue events
- people count
- tracking IDs
- queue length
- waiting time
- occupancy

### Shelf-camera events
- shelf availability
- low-stock alerts
- out-of-stock alerts
- shelf/planogram status

### Optimization events
- camera scan interval
- selected frames
- processing latency
- edge resource utilization

Then add authentication, multi-store support, real-time WebSocket updates, IQ-9075 telemetry and POS/ERP integration.
