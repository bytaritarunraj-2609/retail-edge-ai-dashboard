import os
from flask import Flask, render_template, jsonify, request, Response
from flask_cors import CORS
from db import (
    init_db,
    get_dashboard_data,
    get_tasks,
    update_task_status,
    get_latest_shelf_status,
    get_recent_shelf_events
)

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"])

init_db()

manager = None
def get_manager(start=True):
    global manager
    if manager is None:
        try:
            from camera_manager import manager as cm
            manager = cm
        except Exception as e:
            print("Failed to initialize camera manager:", e)
    if manager and start and not manager.running:
        manager.start()
    return manager

@app.route("/")
def index():
    return render_template("index.html")

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.get("/api/dashboard")
def dashboard():
    return jsonify(get_dashboard_data())

@app.get("/api/shelf-status")
def shelf_status_api():
    latest = get_latest_shelf_status()
    if latest:
        return jsonify({"data": [latest]})
    return jsonify({"data": []})

@app.get("/api/shelf-events")
def shelf_events_api():
    return jsonify(get_recent_shelf_events(20))

@app.get("/api/tasks")
def tasks_api():
    return jsonify(get_tasks())

@app.post("/api/tasks/<int:task_id>/status")
def update_task_status_api(task_id):
    data = request.json
    success = update_task_status(task_id, data.get("status"))
    return jsonify({"success": success})

@app.get("/api/cameras")
def get_cameras():
    mgr = get_manager(start=False)
    if mgr:
        cams = mgr.discover_cameras()
        active_id = mgr.camera_id if mgr.running else None
        default_id = int(os.environ.get("LAPTOP_CAMERA_INDEX", 0))
        return jsonify({
            "active_camera_id": active_id,
            "default_camera_id": default_id,
            "cameras": cams
        })
    return jsonify({"cameras": []})

@app.post("/api/cameras/<camera_id>/activate")
def activate_camera(camera_id):
    mgr = get_manager()
    if mgr:
        cams = mgr.discover_cameras()
        if not any(str(c['id']) == str(camera_id) for c in cams):
            return jsonify({"status": "error", "message": "Camera unavailable"}), 404
        mgr.switch_camera(camera_id)
        return jsonify({"status": "ok"})
    return jsonify({"status": "error"}), 500

@app.get("/api/cameras/<camera_id>/status")
def camera_status(camera_id):
    mgr = get_manager()
    if not mgr:
        return jsonify({"status": "MODEL_UNAVAILABLE"})
    if str(camera_id) != str(mgr.camera_id):
        return jsonify({"status": "INACTIVE"})
    roi = mgr.roi_mgr.get_roi(camera_id)
    return jsonify({
        "status": mgr.status,
        "bottle_count": mgr.bottle_count,
        "shelf_status": mgr.shelf_status,
        "misplaced_objects": mgr.misplaced_list,
        "roi_locked": roi["locked"],
        "roi_points": roi["points"],
        "roi_version": roi.get("version", 1),
        "frame_width": getattr(mgr, "frame_width", 640),
        "frame_height": getattr(mgr, "frame_height", 480),
        "model": "YOLO11n"
    })

@app.post("/api/cameras/<camera_id>/roi")
def update_roi(camera_id):
    mgr = get_manager()
    if mgr:
        data = request.json
        roi_data = mgr.roi_mgr.get_roi(camera_id)
        if not roi_data["locked"]:
            success, version = mgr.roi_mgr.set_roi_points(camera_id, data.get("points"), expected_version=data.get("expected_version"))
            if success:
                return jsonify({"status": "ok", "success": True, "roi_version": version, "points": data.get("points")})
            else:
                return jsonify({"status": "conflict", "success": False, "roi_version": version}), 409
        return jsonify({"status": "error"}), 403
    return jsonify({"status": "error"}), 500

@app.post("/api/cameras/<camera_id>/roi/lock")
def lock_roi(camera_id):
    mgr = get_manager()
    if mgr:
        data = request.json
        mgr.roi_mgr.set_roi_lock(camera_id, data.get("locked"))
        return jsonify({"status": "ok"})
    return jsonify({"status": "error"}), 500

import time
def gen_frames(camera_id):
    while True:
        mgr = get_manager()
        if not mgr or str(camera_id) != str(mgr.camera_id):
            time.sleep(1)
            continue
        frame = mgr.get_latest_frame()
        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        else:
            time.sleep(0.1)

@app.get("/api/cameras/<camera_id>/stream")
def camera_stream(camera_id):
    return Response(gen_frames(camera_id), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(port=5000, debug=True, use_reloader=False)
