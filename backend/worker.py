"""
RetailEdge AI - YOLO Inference Worker (worker.py)
==================================================
Configuration via environment variables or backend .env file:
  YOLO_MODEL_PATH  - path to weights file (default: yolo11n.pt)
  YOLO_SOURCE      - 0 for webcam, or full path to an .mp4 file
  DB_SAVE_INTERVAL - seconds between SQLite writes (default: 5)
  HEADLESS         - set to 1 to suppress OpenCV window
"""
import os, sys, time
from datetime import datetime

# ---------- load .env -------------------------------------------------------
_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

MODEL_PATH       = os.environ.get("YOLO_MODEL_PATH", "yolo11n.pt")
YOLO_SOURCE_ENV  = os.environ.get("YOLO_SOURCE", "0")
DB_SAVE_INTERVAL = float(os.environ.get("DB_SAVE_INTERVAL", "5"))
HEADLESS         = os.environ.get("HEADLESS", "0") == "1"

try:
    YOLO_SOURCE = int(YOLO_SOURCE_ENV)
except ValueError:
    YOLO_SOURCE = YOLO_SOURCE_ENV

# ---------- imports ---------------------------------------------------------
try:
    import cv2
except ImportError:
    print("ERROR: opencv-python not installed. Run: pip install opencv-python")
    sys.exit(1)
try:
    import numpy as np
except ImportError:
    print("ERROR: numpy not installed. Run: pip install numpy")
    sys.exit(1)
try:
    from ultralytics import YOLO
except ImportError:
    print("ERROR: ultralytics not installed. Run: pip install ultralytics")
    sys.exit(1)

from shelf_analytics import ShelfAnalytics
from db import save_shelf_status, save_shelf_event, init_db

# ---------- init db ---------------------------------------------------------
init_db()

# ---------- load model ------------------------------------------------------
print(f"[worker] Loading YOLO model: {MODEL_PATH}")
try:
    model = YOLO(MODEL_PATH)
    print(f"[worker] Model loaded OK — {len(model.names)} classes")
except Exception as exc:
    print(f"ERROR: Could not load model: {exc}")
    sys.exit(1)

# ---------- open video source -----------------------------------------------
print(f"[worker] Opening source: {YOLO_SOURCE}")
is_file = isinstance(YOLO_SOURCE, str)
cap_flags = cv2.CAP_ANY if is_file else cv2.CAP_DSHOW
cap = cv2.VideoCapture(YOLO_SOURCE, cap_flags)

if not is_file:
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))

if not cap.isOpened():
    if is_file and not os.path.exists(YOLO_SOURCE):
        print(f"ERROR: Video file not found: {YOLO_SOURCE}")
    else:
        print(f"ERROR: Could not open source: {YOLO_SOURCE}")
    print("Tip: Set YOLO_SOURCE=0 for webcam or YOLO_SOURCE=C:/path/to/video.mp4 in .env")
    sys.exit(1)

W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
print(f"[worker] Source open {W}x{H}")

# ---------- analytics -------------------------------------------------------
analytics = ShelfAnalytics(shelf_id="SHELF_01")

# ---------- ROI (normalised) ------------------------------------------------
ROI_NORM = [(0.25, 0.20), (0.75, 0.20), (0.75, 0.80), (0.25, 0.80)]

def make_roi(w, h):
    return [(int(x * w), int(y * h)) for x, y in ROI_NORM]

roi_points = make_roi(W, H)

def point_in_poly(px, py, poly):
    n, inside, j = len(poly), False, len(poly) - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi + 1e-9) + xi):
            inside = not inside
        j = i
    return inside

def put_text(f, t, p, s, c, th=1):
    cv2.putText(f, t, p, cv2.FONT_HERSHEY_SIMPLEX, s, c, th, cv2.LINE_AA)

STATUS_COLORS = {
    "AVAILABLE":    (100, 255, 160),
    "OUT_OF_STOCK": (100, 120, 255),
    "UNKNOWN":      (150, 150, 150),
}

if not HEADLESS:
    cv2.namedWindow("RetailEdge AI", cv2.WINDOW_NORMAL)

# ---------- state -----------------------------------------------------------
last_save       = 0.0
last_event_key  = None
fps             = 0.0
fc              = 0
fps_t           = time.time()

print("[worker] Loop started. Press Q in window to stop.")

# ---------- main loop -------------------------------------------------------
while True:
    ret, frame = cap.read()
    if not ret:
        if is_file:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        else:
            time.sleep(0.2)
            continue

    h, w = frame.shape[:2]
    fc += 1
    now = time.time()
    if now - fps_t >= 1.0:
        fps = fc / (now - fps_t); fc = 0; fps_t = now

    # ROI overlay
    pts_np = np.array(roi_points, np.int32)
    ov = frame.copy()
    cv2.fillPoly(ov, [pts_np], (40, 80, 60))
    cv2.addWeighted(ov, 0.25, frame, 0.75, 0, frame)
    cv2.polylines(frame, [pts_np], True, (80, 255, 150), 2)

    # YOLO inference
    try:
        results = model.predict(source=frame, conf=0.35, verbose=False)
    except Exception as exc:
        print(f"[worker] Inference error: {exc}")
        continue

    bottles = 0
    confs   = []
    # ShelfAnalytics.update() expects misplaced_objects as [{"name": str}]
    misplaced_dicts  = []
    misplaced_names  = []

    result = results[0] if results else None
    if result is not None and result.boxes is not None:
        for box in result.boxes:
            cid   = int(box.cls[0])
            cname = model.names[cid]
            conf  = float(box.conf[0])
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

            if not point_in_poly(cx, cy, roi_points):
                continue

            confs.append(conf)
            if cname.lower() == "bottle":
                bottles += 1
                col = (100, 255, 160)
                lbl = f"BOTTLE {conf:.2f}"
            else:
                misplaced_dicts.append({"name": cname})
                misplaced_names.append(cname)
                col = (0, 165, 255)
                lbl = f"{cname.upper()} {conf:.2f}"

            cv2.rectangle(frame, (x1, y1), (x2, y2), col, 2)
            put_text(frame, lbl, (x1, y1 - 8), 0.45, col, 1)

    # Update analytics with correct signature
    analytics.update(bottles, misplaced_dicts, confs)
    ad     = analytics.get_data()
    status = ad["stock_status"]
    avg_c  = analytics.average_confidence  # raw 0..1 float
    ev     = ad["last_event"]

    # SQLite write
    if now - last_save >= DB_SAVE_INTERVAL:
        save_shelf_status({
            "shelf_id":           analytics.shelf_id,
            "bottle_count":       bottles,
            "stock_status":       status,
            "misplaced_objects":  misplaced_names,
            "average_confidence": round(avg_c, 4),
            "timestamp":          datetime.now().isoformat(),
        })
        last_save = now
        print(f"[worker] DB write: {status} | bottles={bottles} | conf={avg_c:.2f} | misplaced={misplaced_names}")

    if ev is not None:
        ek = f"{ev['event_type']}:{ev['timestamp']}"
        if ek != last_event_key:
            save_shelf_event({
                "shelf_id":   analytics.shelf_id,
                "event_type": ev["event_type"],
                "message":    ev["message"],
                "priority":   ev.get("priority", "MEDIUM"),
                "timestamp":  ev["timestamp"],
            })
            last_event_key = ek
            print(f"[worker] Event saved: {ev['event_type']} - {ev['message']}")

    # HUD
    sc = STATUS_COLORS.get(status, (220, 220, 220))
    ct = f"{avg_c * 100:.1f}%" if confs else "--"
    cv2.rectangle(frame, (0, 0), (w, 80), (18, 22, 30), -1)
    put_text(frame, "RetailEdge AI", (30, 45), 0.9, (100, 210, 255), 2)
    put_text(frame, f"{fps:.0f} FPS", (w - 90, 45), 0.5, (140, 150, 165), 1)
    cv2.rectangle(frame, (20, 100), (350, 300), (25, 30, 40), -1)
    cv2.rectangle(frame, (20, 100), (350, 300), (55, 65, 80), 1)
    put_text(frame, "STATUS",   (40, 135), 0.45, (150, 160, 175), 1)
    put_text(frame, status,     (40, 175), 0.65, sc, 2)
    put_text(frame, "BOTTLES",  (40, 215), 0.40, (140, 150, 165), 1)
    put_text(frame, str(bottles), (40, 255), 1.2, (255, 255, 255), 2)
    put_text(frame, "CONF",     (200, 215), 0.40, (140, 150, 165), 1)
    put_text(frame, ct,         (200, 255), 0.70, (220, 225, 230), 2)
    src_lbl = f"SRC:{YOLO_SOURCE}" if is_file else "SRC:WEBCAM"
    put_text(frame, src_lbl, (30, h - 20), 0.4, (120, 130, 145), 1)

    if not HEADLESS:
        cv2.imshow("RetailEdge AI", frame)
        k = cv2.waitKey(1) & 0xFF
        if k == ord("q"):
            break
        elif k == ord("r"):
            roi_points = make_roi(w, h)
    else:
        time.sleep(0.01)

cap.release()
if not HEADLESS:
    cv2.destroyAllWindows()
print("[worker] Done.")
