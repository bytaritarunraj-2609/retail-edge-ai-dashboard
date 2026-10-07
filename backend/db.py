import sqlite3
import json
from datetime import datetime, timedelta

DB_NAME = "retailedge.db"


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


# =========================================================
# INITIAL DATABASE SETUP
# =========================================================

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # -----------------------------------------------------
    # DAILY METRICS
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            footfall INTEGER DEFAULT 0,
            average_wait REAL DEFAULT 0,
            stockouts INTEGER DEFAULT 0,
            shelf_availability REAL DEFAULT 0
        )
    """)

    # -----------------------------------------------------
    # WORKER TASKS
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            location TEXT,
            priority TEXT DEFAULT 'MEDIUM',
            status TEXT DEFAULT 'PENDING',
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()

    # Create our new RetailEdge shelf tables
    init_shelf_tables()

    # Add sample data only if database is empty
    seed_sample_data()


# =========================================================
# SHELF TABLES
# =========================================================

def init_shelf_tables():

    conn = get_connection()
    cursor = conn.cursor()

    # -----------------------------------------------------
    # CURRENT / HISTORICAL SHELF STATUS
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shelf_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shelf_id TEXT NOT NULL,
            bottle_count INTEGER NOT NULL,
            stock_status TEXT NOT NULL,
            misplaced_objects TEXT,
            average_confidence REAL,
            timestamp TEXT NOT NULL
        )
    """)

    # -----------------------------------------------------
    # SHELF EVENTS
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shelf_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shelf_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            message TEXT NOT NULL,
            priority TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# =========================================================
# SAMPLE DATA
# =========================================================

def seed_sample_data():

    conn = get_connection()
    cursor = conn.cursor()

    # Check daily metrics
    cursor.execute("SELECT COUNT(*) FROM daily_metrics")
    metrics_count = cursor.fetchone()[0]

    if metrics_count == 0:

        today = datetime.now()

        sample_metrics = [
            (
                (today - timedelta(days=6)).strftime("%Y-%m-%d"),
                420,
                8.5,
                7,
                91.2
            ),
            (
                (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                465,
                7.8,
                6,
                92.4
            ),
            (
                (today - timedelta(days=4)).strftime("%Y-%m-%d"),
                510,
                7.2,
                5,
                93.1
            ),
            (
                (today - timedelta(days=3)).strftime("%Y-%m-%d"),
                550,
                6.8,
                4,
                94.2
            ),
            (
                (today - timedelta(days=2)).strftime("%Y-%m-%d"),
                590,
                6.1,
                3,
                95.0
            ),
            (
                (today - timedelta(days=1)).strftime("%Y-%m-%d"),
                625,
                5.6,
                2,
                95.8
            ),
            (
                today.strftime("%Y-%m-%d"),
                648,
                5.1,
                2,
                96.2
            )
        ]

        cursor.executemany("""
            INSERT INTO daily_metrics (
                date,
                footfall,
                average_wait,
                stockouts,
                shelf_availability
            )
            VALUES (?, ?, ?, ?, ?)
        """, sample_metrics)

    # Check tasks
    cursor.execute("SELECT COUNT(*) FROM tasks")
    tasks_count = cursor.fetchone()[0]

    if tasks_count == 0:

        now = datetime.now().isoformat()

        sample_tasks = [
            (
                "Restock beverages",
                "Aisle 3",
                "HIGH",
                "PENDING",
                now
            ),
            (
                "Check billing queue",
                "Billing 2",
                "MEDIUM",
                "PENDING",
                now
            ),
            (
                "Remove misplaced item",
                "Aisle 5",
                "MEDIUM",
                "PENDING",
                now
            )
        ]

        cursor.executemany("""
            INSERT INTO tasks (
                title,
                location,
                priority,
                status,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
        """, sample_tasks)

    conn.commit()
    conn.close()


# =========================================================
# SHELF STATUS
# =========================================================

def save_shelf_status(data):

    conn = get_connection()
    cursor = conn.cursor()

    misplaced_objects = data.get("misplaced_objects", [])

    cursor.execute("""
        INSERT INTO shelf_status (
            shelf_id,
            bottle_count,
            stock_status,
            misplaced_objects,
            average_confidence,
            timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data["shelf_id"],
        data["bottle_count"],
        data["stock_status"],
        json.dumps(misplaced_objects),
        data["average_confidence"],
        data["timestamp"]
    ))

    conn.commit()
    conn.close()


def get_latest_shelf_status():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM shelf_status
        ORDER BY id DESC
        LIMIT 1
    """)

    row = cursor.fetchone()

    conn.close()

    if row is None:
        return None

    data = dict(row)

    try:
        data["misplaced_objects"] = json.loads(
            data["misplaced_objects"] or "[]"
        )
    except json.JSONDecodeError:
        data["misplaced_objects"] = []

    return data


# =========================================================
# SHELF EVENTS
# =========================================================

def save_shelf_event(event):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO shelf_events (
            shelf_id,
            event_type,
            message,
            priority,
            timestamp
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        event["shelf_id"],
        event["event_type"],
        event["message"],
        event["priority"],
        event["timestamp"]
    ))

    conn.commit()
    conn.close()


def get_recent_shelf_events(limit=20):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM shelf_events
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    conn.close()

    return [dict(row) for row in rows]


# =========================================================
# DASHBOARD DATA
# =========================================================

def get_dashboard_data():

    conn = get_connection()
    cursor = conn.cursor()

    # Latest metrics
    cursor.execute("""
        SELECT *
        FROM daily_metrics
        ORDER BY date DESC
        LIMIT 1
    """)

    latest = cursor.fetchone()

    # Recent metrics for chart
    cursor.execute("""
        SELECT
            date,
            footfall,
            average_wait,
            stockouts,
            shelf_availability
        FROM daily_metrics
        ORDER BY date ASC
        LIMIT 7
    """)

    chart_rows = cursor.fetchall()

    # Latest shelf status
    cursor.execute("""
        SELECT *
        FROM shelf_status
        ORDER BY id DESC
        LIMIT 1
    """)

    shelf_row = cursor.fetchone()

    # Recent shelf events
    cursor.execute("""
        SELECT *
        FROM shelf_events
        ORDER BY id DESC
        LIMIT 10
    """)

    event_rows = cursor.fetchall()

    conn.close()

    # -----------------------------------------------------
    # METRICS
    # -----------------------------------------------------

    if latest:
        metrics = dict(latest)
    else:
        metrics = {
            "footfall": 0,
            "average_wait": 0,
            "stockouts": 0,
            "shelf_availability": 0
        }

    # -----------------------------------------------------
    # CHART DATA
    # -----------------------------------------------------

    chart_data = [dict(row) for row in chart_rows]

    # -----------------------------------------------------
    # SHELF DATA
    # -----------------------------------------------------

    shelf_status = None

    if shelf_row:

        shelf_status = dict(shelf_row)

        try:
            shelf_status["misplaced_objects"] = json.loads(
                shelf_status["misplaced_objects"] or "[]"
            )
        except json.JSONDecodeError:
            shelf_status["misplaced_objects"] = []

    # -----------------------------------------------------
    # EVENTS
    # -----------------------------------------------------

    events = [dict(row) for row in event_rows]

    return {
        "metrics": metrics,
        "chart": chart_data,
        "shelf_status": shelf_status,
        "events": events
    }


# =========================================================
# TASKS
# =========================================================

def get_tasks():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM tasks
        ORDER BY
            CASE priority
                WHEN 'HIGH' THEN 1
                WHEN 'MEDIUM' THEN 2
                WHEN 'LOW' THEN 3
                ELSE 4
            END,
            id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    return [dict(row) for row in rows]


def update_task_status(task_id, status):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE tasks
        SET status = ?
        WHERE id = ?
    """, (status, task_id))

    conn.commit()

    updated = cursor.rowcount > 0

    conn.close()

    return updated


# =========================================================
# TEST / INITIALIZATION
# =========================================================

if __name__ == "__main__":

    init_db()

    print("===================================")
    print(" RetailEdge Database Ready")
    print("===================================")
    print(f"Database: {DB_NAME}")
    print("Tables initialized successfully.")