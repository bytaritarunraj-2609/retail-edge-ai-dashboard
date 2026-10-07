from ultralytics import YOLO
from shelf_analytics import ShelfAnalytics
from db import save_shelf_status, save_shelf_event
import cv2
import numpy as np
import time
import math


# ============================================================
# RETAILEDGE AI — LIVE SHELF INTELLIGENCE
# ============================================================

MODEL_PATH = "yolo11n.pt"

model = YOLO(MODEL_PATH)

# ============================================================
# ANALYTICS ENGINE
# ============================================================

analytics = ShelfAnalytics(
    shelf_id="SHELF_01"
)
# Database save control
last_status_save = 0
last_saved_event_key = None


# ============================================================
# CAMERA
# ============================================================

cap = cv2.VideoCapture(
    0,
    cv2.CAP_DSHOW
)

cap.set(
    cv2.CAP_PROP_FRAME_WIDTH,
    1280
)

cap.set(
    cv2.CAP_PROP_FRAME_HEIGHT,
    720
)

cap.set(
    cv2.CAP_PROP_FOURCC,
    cv2.VideoWriter_fourcc(*"MJPG")
)


if not cap.isOpened():

    print("❌ Camera could not be opened.")
    exit()


# ============================================================
# WINDOW
# ============================================================

WINDOW = (
    "RetailEdge AI | "
    "Smart Shelf Intelligence"
)

cv2.namedWindow(
    WINDOW,
    cv2.WINDOW_NORMAL
)


# ============================================================
# ROI
# ============================================================

points = [

    (300, 150),

    (950, 150),

    (950, 600),

    (300, 600)

]

initial_points = points.copy()

selected_point = None

dragging = False

roi_locked = False


# ============================================================
# STOCK STABILIZATION
# ============================================================

REQUIRED_FRAMES = 8

detected_frames = 0

empty_frames = 0

stable_stock = False


# ============================================================
# MISPLACED OBJECT STABILIZATION
# ============================================================

misplaced_frames = 0

stable_misplaced = False


# ============================================================
# MOUSE CONTROL
# ============================================================

def mouse_callback(
    event,
    x,
    y,
    flags,
    param
):

    global selected_point
    global dragging

    if roi_locked:

        return


    if event == cv2.EVENT_LBUTTONDOWN:

        for i, (px, py) in enumerate(points):

            distance = math.sqrt(

                (x - px) ** 2
                +
                (y - py) ** 2

            )

            if distance < 30:

                selected_point = i

                dragging = True

                break


    elif (
        event == cv2.EVENT_MOUSEMOVE
        and dragging
    ):

        if selected_point is not None:

            points[selected_point] = (

                max(
                    0,
                    min(x, 1279)
                ),

                max(
                    0,
                    min(y, 719)
                )

            )


    elif event == cv2.EVENT_LBUTTONUP:

        dragging = False

        selected_point = None


cv2.setMouseCallback(
    WINDOW,
    mouse_callback
)


# ============================================================
# UI HELPERS
# ============================================================

def put_text(
    frame,
    text,
    position,
    size=0.6,
    color=(255, 255, 255),
    thickness=1
):

    cv2.putText(

        frame,
        text,
        position,
        cv2.FONT_HERSHEY_SIMPLEX,
        size,
        color,
        thickness,
        cv2.LINE_AA

    )


def draw_glass_panel(
    frame,
    x1,
    y1,
    x2,
    y2
):

    overlay = frame.copy()

    cv2.rectangle(

        overlay,

        (x1, y1),

        (x2, y2),

        (18, 23, 32),

        -1

    )

    frame[:] = cv2.addWeighted(

        overlay,

        0.78,

        frame,

        0.22,

        0

    )

    cv2.rectangle(

        frame,

        (x1, y1),

        (x2, y2),

        (65, 75, 90),

        1

    )


def draw_corner_brackets(
    frame,
    pts,
    color
):

    for x, y in pts:

        length = 18

        cv2.line(

            frame,

            (x - length, y),

            (x - 5, y),

            color,

            3

        )

        cv2.line(

            frame,

            (x + 5, y),

            (x + length, y),

            color,

            3

        )

        cv2.line(

            frame,

            (x, y - length),

            (x, y - 5),

            color,

            3

        )

        cv2.line(

            frame,

            (x, y + 5),

            (x, y + length),

            color,

            3

        )


# ============================================================
# FPS
# ============================================================

previous_time = time.time()

fps = 0


# ============================================================
# MAIN LOOP
# ============================================================

while True:

    # ========================================================
    # CAMERA
    # ========================================================

    ret, frame = cap.read()

    if not ret:

        print(
            "❌ Camera frame unavailable."
        )

        break


    frame = cv2.resize(

        frame,

        (1280, 720)

    )


    # ========================================================
    # FPS
    # ========================================================

    current_time = time.time()

    fps = (

        0.9 * fps

        +

        0.1 /

        max(

            current_time
            -
            previous_time,

            0.001

        )

    )

    previous_time = current_time


    # ========================================================
    # ROI
    # ========================================================

    polygon = np.array(

        points,

        dtype=np.int32

    )


    mask = np.zeros(

        frame.shape[:2],

        dtype=np.uint8

    )


    cv2.fillPoly(

        mask,

        [polygon],

        255

    )


    # ========================================================
    # ROI CROP
    # ========================================================

    x, y, w, h = cv2.boundingRect(

        polygon

    )


    if w > 10 and h > 10:

        roi_crop = frame[

            y:y + h,

            x:x + w

        ]


        roi_mask = mask[

            y:y + h,

            x:x + w

        ]


        roi_crop = cv2.bitwise_and(

            roi_crop,

            roi_crop,

            mask=roi_mask

        )

    else:

        roi_crop = frame


    # ========================================================
    # YOLO — ALL COCO OBJECTS
    # ========================================================

    results = model.predict(

        source=roi_crop,

        conf=0.15,

        imgsz=640,

        verbose=False

    )


    # ========================================================
    # DETECTION DATA
    # ========================================================

    bottle_count = 0

    misplaced_objects = []

    confidences = []


    # ========================================================
    # PROCESS YOLO DETECTIONS
    # ========================================================

    for result in results:

        for box in result.boxes:

            confidence = float(

                box.conf[0]

            )


            class_id = int(

                box.cls[0]

            )


            class_name = model.names[

                class_id

            ]


            # ------------------------------------------------
            # BOX COORDINATES
            # ------------------------------------------------

            bx1, by1, bx2, by2 = map(

                int,

                box.xyxy[0]

            )


            # Convert ROI coordinates
            # to full camera coordinates

            bx1 += x

            bx2 += x

            by1 += y

            by2 += y


            # ------------------------------------------------
            # CENTER
            # ------------------------------------------------

            center_x = int(

                (bx1 + bx2) / 2

            )

            center_y = int(

                (by1 + by2) / 2

            )


            # ------------------------------------------------
            # OBJECT / ROI OVERLAP
            # ------------------------------------------------

            box_area = max(

                (bx2 - bx1)
                *
                (by2 - by1),

                1

            )


            box_mask = np.zeros_like(

                mask

            )


            cv2.rectangle(

                box_mask,

                (bx1, by1),

                (bx2, by2),

                255,

                -1

            )


            intersection = cv2.bitwise_and(

                box_mask,

                mask

            )


            overlap_pixels = (

                cv2.countNonZero(

                    intersection

                )

            )


            overlap_ratio = (

                overlap_pixels
                /
                box_area

            )


            inside = cv2.pointPolygonTest(

                polygon,

                (
                    center_x,
                    center_y
                ),

                False

            )


            object_in_roi = (

                inside >= 0

                or

                overlap_ratio >= 0.10

            )


            if not object_in_roi:

                continue


            # =================================================
            # BOTTLE
            # =================================================

            if class_name.lower() == "bottle":

                bottle_count += 1

                confidences.append(

                    confidence

                )


                green = (

                    90,
                    255,
                    150

                )


                cv2.rectangle(

                    frame,

                    (bx1, by1),

                    (bx2, by2),

                    green,

                    2

                )


                put_text(

                    frame,

                    (
                        f"BOTTLE "
                        f"{confidence * 100:.0f}%"
                    ),

                    (
                        bx1,
                        max(
                            by1 - 10,
                            20
                        )
                    ),

                    0.5,

                    green,

                    1

                )


                cv2.circle(

                    frame,

                    (
                        center_x,
                        center_y
                    ),

                    4,

                    green,

                    -1

                )


            # =================================================
            # OTHER OBJECT
            # =================================================

            else:

                misplaced_objects.append({

                    "name":
                        class_name,

                    "confidence":
                        confidence,

                    "box": (

                        bx1,
                        by1,
                        bx2,
                        by2

                    )

                })


    # ========================================================
    # SEND LIVE DATA TO ANALYTICS ENGINE
    # ========================================================

    analytics.update(

        bottle_count=bottle_count,

        misplaced_objects=misplaced_objects,

        confidences=confidences

    )


    # ========================================================
    # GET ANALYTICS DATA
    # ========================================================

    analytics_data = analytics.get_data()

    # ========================================================
    # SAVE LIVE SHELF DATA TO DATABASE
    # ========================================================




    current_time = time.time()





    # Save shelf status once every second
    if current_time - last_status_save >= 1.0:

        save_shelf_status(analytics_data)

        last_status_save = current_time






    # Save a new event only once
    last_event = analytics_data.get("last_event")





    if last_event is not None:

        event_key = (
            last_event["timestamp"],
            last_event["event_type"],
            last_event["message"]
        )





        if event_key != last_saved_event_key:

            save_shelf_event(last_event)

            last_saved_event_key = event_key





    # ========================================================
    # STOCK STABILIZATION FOR UI
    # ========================================================





    if bottle_count > 0:

        detected_frames += 1

        empty_frames = 0

    else:

        empty_frames += 1

        detected_frames = 0


    if detected_frames >= REQUIRED_FRAMES:

        stable_stock = True

    elif empty_frames >= REQUIRED_FRAMES:

        stable_stock = False



    # ========================================================
    # MISPLACED STATE
    # ========================================================

    if len(misplaced_objects) > 0:

        misplaced_frames += 1

    else:

        misplaced_frames = 0


    if misplaced_frames >= REQUIRED_FRAMES:

        stable_misplaced = True

    elif misplaced_frames == 0:

        stable_misplaced = False


    # ========================================================
    # COLORS
    # ========================================================

    if stable_stock:

        status = "STOCK AVAILABLE"

        status_color = (

            90,
            255,
            150

        )

        roi_color = (

            60,
            220,
            110

        )

    else:

        status = "OUT OF STOCK"

        status_color = (

            100,
            120,
            255

        )

        roi_color = (

            70,
            80,
            240

        )


    # ========================================================
    # TRANSLUCENT ROI
    # ========================================================

    roi_overlay = frame.copy()


    cv2.fillPoly(

        roi_overlay,

        [polygon],

        roi_color

    )


    frame = cv2.addWeighted(

        roi_overlay,

        0.16,

        frame,

        0.84,

        0

    )


    # ========================================================
    # ROI BORDER
    # ========================================================

    cv2.polylines(

        frame,

        [polygon],

        True,

        status_color,

        3,

        cv2.LINE_AA

    )


    # ========================================================
    # DRAW MISPLACED OBJECTS
    # ========================================================

    for obj in misplaced_objects:

        bx1, by1, bx2, by2 = (

            obj["box"]

        )

        confidence = (

            obj["confidence"]

        )

        object_name = (

            obj["name"].upper()

        )


        orange = (

            0,
            165,
            255

        )


        # Orange box

        cv2.rectangle(

            frame,

            (bx1, by1),

            (bx2, by2),

            orange,

            3

        )


        # Label

        label = (

            f"MISPLACED / "
            f"{object_name}"

        )


        label_y = max(

            by1 - 10,

            30

        )


        text_size = (

            cv2.getTextSize(

                label,

                cv2.FONT_HERSHEY_SIMPLEX,

                0.50,

                1

            )[0]

        )


        cv2.rectangle(

            frame,

            (

                bx1,

                label_y - 25

            ),

            (

                bx1
                +
                text_size[0]
                +
                12,

                label_y + 2

            ),

            orange,

            -1

        )


        put_text(

            frame,

            label,

            (

                bx1 + 6,

                label_y - 5

            ),

            0.50,

            (255, 255, 255),

            1

        )


        put_text(

            frame,

            f"{confidence * 100:.0f}%",

            (

                bx1,

                min(
                    by2 + 20,
                    650
                )

            ),

            0.45,

            orange,

            1

        )


    # ========================================================
    # CORNER HANDLES
    # ========================================================

    if not roi_locked:

        for i, (px, py) in enumerate(points):

            cv2.circle(

                frame,

                (px, py),

                10,

                (20, 20, 25),

                -1

            )


            cv2.circle(

                frame,

                (px, py),

                8,

                status_color,

                2

            )


            put_text(

                frame,

                str(i + 1),

                (
                    px + 12,
                    py - 12
                ),

                0.45,

                status_color,

                1

            )


    draw_corner_brackets(

        frame,

        points,

        status_color

    )


    # ========================================================
    # TOP HUD
    # ========================================================

    hud = frame.copy()


    cv2.rectangle(

        hud,

        (0, 0),

        (1280, 105),

        (12, 16, 24),

        -1

    )


    frame = cv2.addWeighted(

        hud,

        0.82,

        frame,

        0.18,

        0

    )


    # ========================================================
    # BRAND
    # ========================================================

    put_text(

        frame,

        "RETAILEDGE",

        (30, 38),

        0.9,

        (255, 255, 255),

        2

    )


    put_text(

        frame,

        "AI",

        (185, 38),

        0.9,

        (100, 210, 255),

        2

    )


    put_text(

        frame,

        "SMART SHELF INTELLIGENCE",

        (30, 65),

        0.45,

        (140, 150, 165),

        1

    )


    # ========================================================
    # LIVE INDICATOR
    # ========================================================

    cv2.circle(

        frame,

        (1130, 32),

        6,

        (80, 255, 150),

        -1

    )


    put_text(

        frame,

        "LIVE",

        (1145, 38),

        0.5,

        (200, 210, 220),

        1

    )


    put_text(

        frame,

        f"{fps:.0f} FPS",

        (1210, 38),

        0.45,

        (140, 150, 165),

        1

    )


    # ========================================================
    # STATUS PANEL
    # ========================================================

    draw_glass_panel(

        frame,

        30,
        125,
        350,
        300

    )


    put_text(

        frame,

        "SHELF STATUS",

        (55, 155),

        0.5,

        (150, 160, 175),

        1

    )


    put_text(

        frame,

        status,

        (55, 195),

        0.68,

        status_color,

        2

    )


    put_text(

        frame,

        "DETECTED BOTTLES",

        (55, 235),

        0.4,

        (140, 150, 165),

        1

    )


    put_text(

        frame,

        str(bottle_count),

        (55, 275),

        1.2,

        (255, 255, 255),

        2

    )


    # ========================================================
    # CONFIDENCE
    # ========================================================

    if confidences:

        avg_confidence = (

            sum(confidences)
            /
            len(confidences)

        )

        confidence_text = (

            f"{avg_confidence * 100:.1f}%"

        )

    else:

        confidence_text = "--"


    put_text(

        frame,

        "AVG CONFIDENCE",

        (180, 235),

        0.4,

        (140, 150, 165),

        1

    )


    put_text(

        frame,

        confidence_text,

        (180, 275),

        0.7,

        (220, 225, 230),

        2

    )


    # ========================================================
    # LIVE EVENT PANEL
    # ========================================================

    last_event = analytics_data["last_event"]


    if last_event is not None:

        draw_glass_panel(

            frame,

            30,
            440,
            400,
            535

        )


        event_type = (

            last_event["event_type"]

        )


        event_message = (

            last_event["message"]

        )


        if event_type == "STOCKOUT":

            event_color = (

                100,
                120,
                255

            )

        elif event_type == "MISPLACED_OBJECT":

            event_color = (

                0,
                165,
                255

            )

        else:

            event_color = (

                100,
                255,
                160

            )


        put_text(

            frame,

            "LATEST EVENT",

            (55, 470),

            0.42,

            (150, 160, 175),

            1

        )


        put_text(

            frame,

            event_type,

            (55, 498),

            0.60,

            event_color,

            2

        )


        put_text(

            frame,

            event_message[:38],

            (55, 522),

            0.40,

            (220, 225, 230),

            1

        )


    # ========================================================
    # ROI CONTROL
    # ========================================================

    draw_glass_panel(

        frame,

        960,
        125,
        1250,
        255

    )


    put_text(

        frame,

        "ROI CONTROL",

        (985, 155),

        0.5,

        (150, 160, 175),

        1

    )


    if roi_locked:

        roi_state = "LOCKED"

        roi_state_color = (

            100,
            255,
            160

        )

    else:

        roi_state = "EDITING"

        roi_state_color = (

            100,
            210,
            255

        )


    put_text(

        frame,

        roi_state,

        (985, 195),

        0.7,

        roi_state_color,

        2

    )


    put_text(

        frame,

        "S  Lock / Unlock",

        (985, 225),

        0.4,

        (180, 185, 195),

        1

    )


    put_text(

        frame,

        "R  Reset ROI",

        (985, 245),

        0.4,

        (180, 185, 195),

        1

    )


    # ========================================================
    # BOTTOM BAR
    # ========================================================

    bottom_y = 680


    cv2.line(

        frame,

        (25, bottom_y - 25),

        (1255, bottom_y - 25),

        (55, 65, 80),

        1

    )


    put_text(

        frame,

        "EDGE NODE",

        (30, bottom_y),

        0.4,

        (120, 130, 145),

        1

    )


    put_text(

        frame,

        "LOCAL INFERENCE",

        (120, bottom_y),

        0.4,

        (100, 255, 160),

        1

    )


    put_text(

        frame,

        "YOLO • COCO 80",

        (300, bottom_y),

        0.4,

        (120, 130, 145),

        1

    )


    put_text(

        frame,

        "ANALYTICS ACTIVE",

        (430, bottom_y),

        0.4,

        (100, 255, 160),

        1

    )


    put_text(

        frame,

        "CAMERA 01",

        (600, bottom_y),

        0.4,

        (120, 130, 145),

        1

    )


    put_text(

        frame,

        "Q  EXIT",

        (1160, bottom_y),

        0.4,

        (150, 160, 175),

        1

    )


    # ========================================================
    # DISPLAY
    # ========================================================

    cv2.imshow(

        WINDOW,

        frame

    )


    # ========================================================
    # KEYBOARD
    # ========================================================

    key = cv2.waitKey(1) & 0xFF


    # --------------------------------------------------------
    # LOCK
    # --------------------------------------------------------

    if key == ord("s"):

        roi_locked = not roi_locked

        if roi_locked:

            print("🔒 ROI LOCKED")

        else:

            print("✏️ ROI EDIT MODE")


    # --------------------------------------------------------
    # RESET
    # --------------------------------------------------------

    elif key == ord("r"):

        points = initial_points.copy()

        roi_locked = False

        detected_frames = 0

        empty_frames = 0

        misplaced_frames = 0

        stable_stock = False

        stable_misplaced = False

        print("🔄 ROI RESET")


    # --------------------------------------------------------
    # QUIT
    # --------------------------------------------------------

    elif key == ord("q"):

        break


# ============================================================
# CLEANUP
# ============================================================

cap.release()

cv2.destroyAllWindows()

print()
print("RetailEdge AI stopped.")
print()