from ultralytics import YOLO
import cv2

# Load YOLO
model = YOLO("yolo11n.pt")

# Open laptop webcam
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

# Camera resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

if not cap.isOpened():
    print("❌ Could not access camera")
    exit()

print("✅ RetailEdge ROI detection started!")
print("Press Q to quit.")

while True:

    ret, frame = cap.read()

    if not ret:
        print("❌ Could not read camera frame")
        break

    # ------------------------------------------------
    # 1. DEFINE SHELF ROI
    # ------------------------------------------------

    height, width = frame.shape[:2]

    # ROI coordinates
    x1 = int(width * 0.20)
    y1 = int(height * 0.20)

    x2 = int(width * 0.80)
    y2 = int(height * 0.80)

    # Crop only the shelf region
    roi = frame[y1:y2, x1:x2]

    # ------------------------------------------------
    # 2. RUN YOLO ONLY ON ROI
    # ------------------------------------------------

    results = model.predict(
        source=roi,
        conf=0.40,
        verbose=False
    )

    bottle_count = 0

    # ------------------------------------------------
    # 3. PROCESS DETECTIONS
    # ------------------------------------------------

    for result in results:

        for box in result.boxes:

            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            confidence = float(box.conf[0])

            # Only count bottles
            if class_name == "bottle" and confidence >= 0.40:

                bottle_count += 1

                # Coordinates relative to ROI
                bx1, by1, bx2, by2 = map(
                    int,
                    box.xyxy[0]
                )

                # Convert ROI coordinates
                # back to full-frame coordinates
                bx1 += x1
                bx2 += x1
                by1 += y1
                by2 += y1

                # Draw bottle box
                cv2.rectangle(
                    frame,
                    (bx1, by1),
                    (bx2, by2),
                    (0, 255, 0),
                    2
                )

                cv2.putText(
                    frame,
                    f"Bottle {confidence:.2f}",
                    (bx1, by1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2
                )

    # ------------------------------------------------
    # 4. STOCK STATUS
    # ------------------------------------------------

    if bottle_count > 0:

        status = "IN STOCK"
        status_color = (0, 255, 0)

    else:

        status = "OUT OF STOCK"
        status_color = (0, 0, 255)

    # ------------------------------------------------
    # 5. DRAW ROI
    # ------------------------------------------------

    cv2.rectangle(
        frame,
        (x1, y1),
        (x2, y2),
        (255, 165, 0),
        3
    )

    cv2.putText(
        frame,
        "SHELF ROI",
        (x1, y1 - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 165, 0),
        2
    )

    # ------------------------------------------------
    # 6. DISPLAY RETAIL ANALYTICS
    # ------------------------------------------------

    cv2.putText(
        frame,
        f"Bottles: {bottle_count}",
        (30, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Status: {status}",
        (30, 90),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        status_color,
        3
    )

    # ------------------------------------------------
    # 7. SHOW CAMERA
    # ------------------------------------------------

    cv2.imshow(
        "RetailEdge AI - Shelf Intelligence",
        frame
    )

    # Quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# ------------------------------------------------
# CLEANUP
# ------------------------------------------------

cap.release()
cv2.destroyAllWindows()