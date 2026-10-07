from ultralytics import YOLO
import cv2

model = YOLO("yolo11n.pt")

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()

    if not ret:
        print("Camera frame failed")
        break

    results = model.predict(
        source=frame,
        conf=0.25,
        verbose=False
    )

    annotated = results[0].plot()

    cv2.imshow("RetailEdge - YOLO Bottle Detection", annotated)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()