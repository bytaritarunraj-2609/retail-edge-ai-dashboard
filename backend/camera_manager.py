import cv2
import threading
import time
import numpy as np
from ultralytics import YOLO
import os
import db
from roi_manager import ROIManager
from shelf_analytics import ShelfAnalytics

class CameraManager:
    def __init__(self):
        self.camera_id = int(os.environ.get("DEFAULT_CAMERA_INDEX", 0))
        self.cap = None
        self.model = None
        self.running = False
        self.thread = None
        self.current_frame = None
        self.lock = threading.Lock()
        
        self.roi_mgr = ROIManager()
        self.analytics = ShelfAnalytics(str(self.camera_id))
        
        self.status = "INACTIVE"
        self.bottle_count = 0
        self.misplaced_list = []
        self.shelf_status = "NORMAL"
        
        self.empty_since = 0
        self.camera_read_failures = 0

        self.empty_grace = int(os.environ.get("OUT_OF_STOCK_GRACE_FRAMES", 10))
        self.camera_backends = {}
        self.frame_width = 640
        self.frame_height = 480
        
    def start(self):
        if not self.running:
            self.model = YOLO(os.environ.get("YOLO_MODEL_PATH", "yolo11n.pt"))
            self.running = True
            self.thread = threading.Thread(target=self._loop, daemon=True)
            self.thread.start()
            
    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        if self.cap:
            self.cap.release()

    def switch_camera(self, new_id):
        with self.lock:
            self.camera_id = int(new_id)
            if self.cap:
                self.cap.release()
                self.cap = None
            self.status = "CONNECTING"
            self.empty_since = 0
            self.camera_read_failures = 0
            self.analytics = ShelfAnalytics(str(self.camera_id))
            self.current_frame = None
            if self.model and hasattr(self.model, "predictor") and self.model.predictor:
                if hasattr(self.model.predictor, "trackers"):
                    for tracker in self.model.predictor.trackers:
                        if hasattr(tracker, "reset"):
                            tracker.reset()

    
    def discover_cameras(self):
        import time, threading
        if not hasattr(self, 'cached_cameras'):
            self.cached_cameras = []
            self.discovery_thread = None
            self.last_discovery = 0
            
        def _run_discovery():
            max_idx = int(os.environ.get("CAMERA_SCAN_MAX", 10))
            laptop_idx = int(os.environ.get("LAPTOP_CAMERA_INDEX", 0))
            cameras = []
            backends_to_try = [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_ANY] if os.name == 'nt' else [cv2.CAP_ANY]
            if not hasattr(self, 'camera_backends'):
                self.camera_backends = {}
            for i in range(max_idx):
                name = "Laptop Webcam" if i == laptop_idx else f"Camera {i}"
                is_active = (self.camera_id == i and self.running)
                if is_active and self.cap is not None and self.cap.isOpened():
                    w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or getattr(self, 'frame_width', 640)
                    h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or getattr(self, 'frame_height', 480)
                    cameras.append({"id": i, "name": name, "available": True, "active": True, "width": w, "height": h})
                    continue
                for backend in backends_to_try:
                    cap = None
                    try:
                        cap = cv2.VideoCapture(i, backend)
                        if cap.isOpened():
                            ret, _ = cap.read()
                            if ret:
                                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
                                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
                                self.camera_backends[i] = backend
                                cameras.append({"id": i, "name": name, "available": True, "active": False, "width": w, "height": h})
                                break
                    except Exception:
                        pass
                    finally:
                        if cap:
                            cap.release()
            self.cached_cameras = cameras
            self.last_discovery = time.time()
            self.discovery_thread = None

        if self.discovery_thread is None and time.time() - self.last_discovery > 10:
            self.discovery_thread = threading.Thread(target=_run_discovery)
            self.discovery_thread.daemon = True
            self.discovery_thread.start()
            
        if not self.cached_cameras and self.discovery_thread:
            self.discovery_thread.join(timeout=3.0)
            
        return self.cached_cameras

    def get_latest_frame(self):
        with self.lock:
            if self.current_frame is not None:
                ret, buffer = cv2.imencode('.jpg', self.current_frame)
                if ret:
                    return buffer.tobytes()
        return None

    def _loop(self):
        db_interval = float(os.environ.get("DB_SAVE_INTERVAL", "5"))
        last_save = 0
        
        while self.running:
            with self.lock:
                if self.cap is None:
                    backend = self.camera_backends.get(self.camera_id, cv2.CAP_DSHOW if os.name == 'nt' else cv2.CAP_ANY)
                    self.cap = cv2.VideoCapture(self.camera_id, backend)
                    if not self.cap.isOpened():
                        self.status = "UNAVAILABLE"
                        self.cap.release()
                        self.cap = None
                    else:
                        self.status = "LIVE"
                        self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
                        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
                        
            if self.cap is None:
                time.sleep(1)
                continue
                


            with self.lock:
                if self.cap:
                    ret, frame = self.cap.read()
                else:
                    ret, frame = False, None
                    
            if not ret:
                self.camera_read_failures += 1
                if self.camera_read_failures > int(os.environ.get("CAMERA_READ_FAILURE_LIMIT", 20)) and self.camera_id != int(os.environ.get("LAPTOP_CAMERA_INDEX", 0)):
                    self.switch_camera(int(os.environ.get("LAPTOP_CAMERA_INDEX", 0)))
                time.sleep(0.1)
                continue
                
            self.camera_read_failures = 0

                
            h, w = frame.shape[:2]
            
            roi_data = self.roi_mgr.get_roi(self.camera_id)
            pts = roi_data["points"]
            roi_polygon = np.array([[(p['x']*w), (p['y']*h)] for p in pts], dtype=np.int32)
            
            results = self.model.track(frame, persist=True, verbose=False, conf=float(os.environ.get("YOLO_CONFIDENCE", "0.25")))
            
            bottles = 0
            misplaced = []
            confidences = []
            
            annotated_frame = frame.copy()
            
            roi_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.fillPoly(roi_mask, [roi_polygon], 255)
            
            if results and len(results[0].boxes) > 0:
                for box in results[0].boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    
                    box_mask = np.zeros((h, w), dtype=np.uint8)
                    cv2.rectangle(box_mask, (x1, y1), (x2, y2), 255, -1)
                    inter = cv2.bitwise_and(roi_mask, box_mask)
                    inter_area = cv2.countNonZero(inter)
                    box_area = (x2-x1) * (y2-y1)
                    
                    if box_area > 0 and (inter_area / box_area) > float(os.environ.get("ROI_MIN_INTERSECTION", "0.20")):
                        confidences.append(conf)
                        cls_name = self.model.names[cls_id]
                        if cls_name == "bottle":
                            bottles += 1
                            label = f"Bottle {conf:.2f}"
                            if box.id is not None:
                                label = f"Bottle #{int(box.id[0])} {conf:.2f}"
                            cv2.rectangle(annotated_frame, (x1,y1), (x2,y2), (0, 255, 0), 2)
                            cv2.putText(annotated_frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                        else:
                            misplaced.append({"name": cls_name})
                            label = f"Misplaced object * {cls_name}"
                            cv2.rectangle(annotated_frame, (x1,y1), (x2,y2), (0, 165, 255), 2)
                            cv2.putText(annotated_frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)
            
            self.analytics.update(bottle_count=bottles, misplaced_objects=misplaced, confidences=confidences)
            
            if misplaced:
                self.shelf_status = "MISPLACED"
                self.empty_since = 0
            elif bottles > 0:
                self.shelf_status = "AVAILABLE"
                self.empty_since = 0
            else:
                if self.empty_since == 0:
                    self.empty_since = time.time()
                elif (time.time() - self.empty_since) * 1000 > float(os.environ.get("STOCK_EMPTY_GRACE_MS", "300")):
                    self.shelf_status = "OUT_OF_STOCK"
            
            with self.lock:
                self.current_frame = annotated_frame
                self.bottle_count = bottles
                self.misplaced_list = [m["name"] for m in misplaced]
                
            now = time.time()
            if now - last_save > db_interval:
                last_save = now
                data = self.analytics.get_data()
                # Overwrite status with temporal logic if needed, but analytics does its own status
                # db.save_shelf_status expects the dict from get_data()
                db.save_shelf_status(data)
                
manager = CameraManager()
