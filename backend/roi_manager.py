import json
import os

ROI_FILE = "roi_config.json"

class ROIManager:
    def __init__(self):
        self.rois = {}
        self.load()

    def load(self):
        if os.path.exists(ROI_FILE):
            try:
                with open(ROI_FILE, 'r') as f:
                    self.rois = json.load(f)
            except:
                self.rois = {}

    def save(self):
        with open(ROI_FILE, 'w') as f:
            json.dump(self.rois, f)

    def get_roi(self, camera_id):
        cid = str(camera_id)
        if cid not in self.rois:
            self.rois[cid] = {
                "version": 1,
                "points": [{"x": 0.1, "y": 0.1}, {"x": 0.9, "y": 0.1}, {"x": 0.9, "y": 0.9}, {"x": 0.1, "y": 0.9}],
                "locked": False
            }
            self.save()
        if "version" not in self.rois[cid]:
            self.rois[cid]["version"] = 1
            self.save()
        return self.rois[cid]

    def set_roi_points(self, camera_id, points, expected_version=None):
        cid = str(camera_id)
        roi = self.get_roi(cid)
        
        if expected_version is not None and roi.get("version", 1) != expected_version:
            return False, roi.get("version", 1)
            
        self.rois[cid]["points"] = points
        self.rois[cid]["version"] = roi.get("version", 1) + 1
        self.save()
        return True, self.rois[cid]["version"]

    def set_roi_lock(self, camera_id, locked):
        cid = str(camera_id)
        if cid not in self.rois:
            self.get_roi(cid)
        self.rois[cid]["locked"] = locked
        self.save()
