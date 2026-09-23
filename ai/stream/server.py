import base64
import json
import io
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import numpy as np
import cv2
from PIL import Image

app = FastAPI()

# Phase 1 Clean Baseline Configuration
YOLO_CONFIDENCE_THRESHOLD = 0.25
YOLO_INFERENCE_SIZE = 960

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading YOLO11n...")
model = YOLO("yolo11n.pt")

@app.websocket("/ws/shelf")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("\n[INFO] Dashboard connected to shelf stream.")
    try:
        while True:
            try:
                data = await websocket.receive_text()
            except WebSocketDisconnect:
                print("[INFO] Dashboard disconnected from shelf stream.")
                break
            except Exception as e:
                print(f"[ERROR] Failed to receive from websocket: {e}")
                break
                
            try:
                payload = json.loads(data)
                img_data = payload.get("image", "")
                
                if "," in img_data:
                    img_data = img_data.split(",")[1]
                    
                image_bytes = base64.b64decode(img_data)
                image = Image.open(io.BytesIO(image_bytes))
                frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                
                frame_height, frame_width = frame.shape[:2]
                detections = []
                
                # --- PHASE 1: CLEAN RAW INFERENCE ---
                inference_start = time.time()
                
                # Pass original full frame to YOLO
                results = model(frame, verbose=False, conf=YOLO_CONFIDENCE_THRESHOLD, imgsz=YOLO_INFERENCE_SIZE)
                
                inference_end = time.time()
                inference_time = inference_end - inference_start
                inference_fps = 1.0 / inference_time if inference_time > 0 else 0
                
                if len(results) > 0 and len(results[0].boxes) > 0:
                    for box in results[0].boxes:
                        class_id = int(box.cls[0].item())
                        confidence = float(box.conf[0].item())
                        class_name = results[0].names[class_id]
                        
                        # Use raw bounding boxes directly from YOLO
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        
                        detections.append({
                            "classId": class_id,
                            "className": class_name,
                            "confidence": round(confidence, 4),
                            "x1": round(x1, 2),
                            "y1": round(y1, 2),
                            "x2": round(x2, 2),
                            "y2": round(y2, 2)
                        })
                        
                # Send raw data back
                await websocket.send_text(json.dumps({
                    "frameWidth": frame_width,
                    "frameHeight": frame_height,
                    "inferenceFps": round(inference_fps, 1),
                    "detections": detections
                }))
                
            except Exception as e:
                print(f"[ERROR] Frame processing failed: {e}")
                
    except Exception as e:
        print(f"[ERROR] WebSocket handler crashed: {e}")
    finally:
        print("[INFO] Clean up connection.")

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*40)
    print("RETAIL EDGE AI")
    print("EDGE INFERENCE SERVER")
    print("="*40)
    print("\nCamera: READY (Waiting for connection)")
    print("YOLO11n: LOADED")
    print("WebSocket: ws://localhost:8000/ws/shelf")
    print("ROI Processor: READY")
    print("STATUS: READY\n")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
