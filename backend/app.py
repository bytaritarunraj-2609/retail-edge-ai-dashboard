from flask import Flask, render_template, jsonify, request
from flask_cors import CORS

from db import (
    init_db,
    get_dashboard_data,
    get_tasks,
    update_task_status,
    get_latest_shelf_status,
    get_recent_shelf_events
)


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)

CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Initialize database
init_db()


# ============================================================
# MAIN DASHBOARD
# ============================================================

@app.route("/")
def index():
    return render_template("index.html")


# ============================================================
# DASHBOARD API
# ============================================================

@app.get("/api/dashboard")
def dashboard():
    return jsonify(get_dashboard_data())


# ============================================================
# SHELF STATUS API
# ============================================================

@app.get("/api/shelf-status")
def shelf_status_api():

    data = get_latest_shelf_status()

    if data is None:
        return jsonify({"available": False})

    return jsonify({"available": True, "data": data})


# ============================================================
# SHELF EVENTS API
# ============================================================

@app.get("/api/shelf-events")
def shelf_events_api():
    events = get_recent_shelf_events(20)
    return jsonify({"events": events})


# ============================================================
# WORKER TASKS API
# ============================================================

@app.get("/api/tasks")
def tasks():
    return jsonify(get_tasks())


# ============================================================
# UPDATE TASK STATUS
# ============================================================

@app.post("/api/tasks/<int:task_id>/status")
def task_status(task_id):

    payload = request.get_json(silent=True) or {}
    status = payload.get("status")

    if status not in {"pending", "in_progress", "completed"}:
        return jsonify({"error": "Invalid status"}), 400

    if not update_task_status(task_id, status):
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"success": True})


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


# ============================================================
# START FLASK SERVER
# ============================================================

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
