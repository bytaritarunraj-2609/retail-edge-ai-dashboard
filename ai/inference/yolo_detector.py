import argparse
import json
import os
import sys
import time
from pathlib import Path

# Ensure 'ai' directory is in path for module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from intelligence.retail_intelligence import RetailIntelligenceEngine

try:
    from ultralytics import YOLO
    import cv2
except ImportError:
    print("Error: ultralytics or cv2 package not found.")
    exit(1)

# Generate a 5x4 grid for 20 prototype zones
ZONES = []
for row in range(4):
    for col in range(5):
        zone_idx = row * 5 + col + 1
        zone_id = f"Z{zone_idx:02d}"
        ZONES.append({
            "zoneId": zone_id,
            "zoneName": f"Zone {zone_idx:02d}",
            "x1": col * 0.2,
            "y1": row * 0.25,
            "x2": (col + 1) * 0.2,
            "y2": (row + 1) * 0.25
        })

def get_zone(nx, ny):
    """Find which zone contains the normalized coordinates (nx, ny)."""
    for z in ZONES:
        if z["x1"] <= nx <= z["x2"] and z["y1"] <= ny <= z["y2"]:
            return z
    return None

def get_activity_level(active_count):
    """Simple deterministic activity classification."""
    if active_count == 0:
        return "LOW"
    elif active_count <= 2:
        return "MEDIUM"
    else:
        return "HIGH"

def process_frame(result, timestamp, frame_width, frame_height, track_state, zone_stats, transitions):
    detections = []
    names = result.names
    
    current_active = {z["zoneId"]: 0 for z in ZONES}
    new_tracks = {z["zoneId"]: 0 for z in ZONES}
    
    if not result.boxes:
        return detections, current_active, new_tracks
        
    for box in result.boxes:
        class_id = int(box.cls[0].item())
        confidence = float(box.conf[0].item())
        track_id = int(box.id[0].item()) if box.id is not None else None
        
        if class_id == 0:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            # Compute center and normalize
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
            nx = cx / frame_width
            ny = cy / frame_height
            
            zone = get_zone(nx, ny)
            zone_id = zone["zoneId"] if zone else None
            zone_name = zone["zoneName"] if zone else None
            
            # Process tracking state and transitions if track_id exists
            if track_id is not None:
                if track_id not in track_state:
                    track_state[track_id] = {"current_zone": None, "entry_time": None, "history": []}
                
                prev_zone = track_state[track_id]["current_zone"]
                
                # Zone Transition
                if prev_zone != zone_id:
                    # If leaving a valid zone, calculate dwell time
                    if prev_zone is not None:
                        dwell = timestamp - track_state[track_id]["entry_time"]
                        zone_stats[prev_zone]["completed_visits"] += 1
                        zone_stats[prev_zone]["total_dwell_time"] += dwell
                        zone_stats[prev_zone]["total_exits"] += 1
                        if dwell > zone_stats[prev_zone].get("max_dwell_time", 0.0):
                            zone_stats[prev_zone]["max_dwell_time"] = dwell
                        
                    # If entering a valid new zone
                    if zone_id is not None:
                        new_tracks[zone_id] += 1
                        zone_stats[zone_id]["total_entries"] += 1
                        zone_stats[zone_id]["unique_visitors"].add(track_id)
                        
                    # Record transition
                    if prev_zone is not None or zone_id is not None:
                        transitions.append({
                            "trackId": track_id,
                            "fromZone": prev_zone,
                            "toZone": zone_id,
                            "timestamp": timestamp
                        })
                        track_state[track_id]["history"].append(zone_id)
                    
                    # Update state
                    track_state[track_id]["current_zone"] = zone_id
                    track_state[track_id]["entry_time"] = timestamp

            # Count current active occupancy
            if zone_id is not None:
                current_active[zone_id] += 1

            detection = {
                "trackId": track_id, 
                "classId": class_id,
                "className": names[class_id],
                "confidence": round(confidence, 4),
                "bbox": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                "timestamp": timestamp,
                "zoneId": zone_id,
                "zoneName": zone_name
            }
            detections.append(detection)
            
    # Update peak occupancies
    for zid, count in current_active.items():
        if count > zone_stats[zid]["peak_occupancy"]:
            zone_stats[zid]["peak_occupancy"] = count
            
    return detections, current_active, new_tracks

def run_inference(source_path, output_dir, use_tracking=False, save_video=False):
    print(f"Loading YOLO11n model...")
    model = YOLO("yolo11n.pt")
    print(f"Running inference on {source_path} (Tracking: {use_tracking})...")
    
    if use_tracking:
        results_generator = model.track(source=source_path, tracker="bytetrack.yaml", stream=True)
    else:
        results_generator = model(source=source_path, stream=True)
    
    all_detections = []
    transitions = []
    
    # Tracking state: track_id -> {current_zone, entry_time, history}
    track_state = {}
    
    # Zone stats: zone_id -> {unique_visitors: set(), peak_occupancy, total_entries, total_exits, completed_visits, total_dwell_time, max_dwell_time}
    zone_stats = {z["zoneId"]: {
        "unique_visitors": set(),
        "peak_occupancy": 0,
        "total_entries": 0,
        "total_exits": 0,
        "completed_visits": 0,
        "total_dwell_time": 0.0,
        "max_dwell_time": 0.0
    } for z in ZONES}
    
    video_writer = None
    start_time = time.time()
    frames_processed = 0
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Note: Using video framerate for mock timestamp steps if using a video
    # to provide deterministic dwells instead of real execution time, which varies by CPU.
    # We will simulate 1 frame = 1/30th of a second for deterministic timestamps.
    simulated_timestamp = 1790090000.0
    
    for i, result in enumerate(results_generator):
        simulated_timestamp += (1.0 / 30.0)
        frames_processed += 1
        
        orig_img = result.orig_img
        frame_height, frame_width = orig_img.shape[:2]
        
        frame_detections, current_active, new_tracks = process_frame(
            result, simulated_timestamp, frame_width, frame_height, track_state, zone_stats, transitions
        )
        
        if frame_detections:
            all_detections.append({
                "frame": i,
                "timestamp": simulated_timestamp,
                "detections": frame_detections
            })
            
        if save_video:
            annotated_frame = result.plot()
            
            # Draw subtle zone boundaries
            for z in ZONES:
                zx1, zy1 = int(z["x1"] * frame_width), int(z["y1"] * frame_height)
                zx2, zy2 = int(z["x2"] * frame_width), int(z["y2"] * frame_height)
                cv2.rectangle(annotated_frame, (zx1, zy1), (zx2, zy2), (255, 255, 255), 1)
                cv2.putText(annotated_frame, z["zoneId"], (zx1 + 5, zy1 + 15), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            # Add Zone labels to boxes
            for det in frame_detections:
                if det["trackId"] is not None and det["zoneId"] is not None:
                    bx1, by1 = int(det["bbox"][0]), int(det["bbox"][1])
                    label = f"PERSON #{det['trackId']} ZONE {det['zoneId']}"
                    cv2.putText(annotated_frame, label, (bx1, max(15, by1 - 20)), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
            
            if video_writer is None:
                out_path = os.path.join(output_dir, f"annotated_zone_{Path(source_path).stem}.mp4")
                video_writer = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*'mp4v'), 30, (frame_width, frame_height))
            video_writer.write(annotated_frame)
            
    total_time = time.time() - start_time
    fps = frames_processed / total_time if total_time > 0 else 0
    
    if video_writer:
        video_writer.release()
            
    # Process final ongoing dwells
    for track_id, state in track_state.items():
        if state["current_zone"] is not None:
            dwell = simulated_timestamp - state["entry_time"]
            zone_stats[state["current_zone"]]["completed_visits"] += 1
            zone_stats[state["current_zone"]]["total_dwell_time"] += dwell
            if dwell > zone_stats[state["current_zone"]].get("max_dwell_time", 0.0):
                zone_stats[state["current_zone"]]["max_dwell_time"] = dwell
            # We don't increment exits here because they didn't leave the zone, but we count the dwell.
            
    agg_start_time = time.time()
    # Generate Retail Telemetry
    engine = RetailIntelligenceEngine(source_name=Path(source_path).name, is_demo=True)
    telemetry = engine.aggregate(track_state, zone_stats, transitions, all_detections, ZONES)
    agg_end_time = time.time()
    
    # Generate Zone Summary Output
    zone_summaries = []
    busiest_zone = None
    highest_occupancy = 0
    zones_with_activity = 0
    
    for zid, stats in zone_stats.items():
        avg_dwell = (stats["total_dwell_time"] / stats["completed_visits"]) if stats["completed_visits"] > 0 else 0.0
        
        summary = {
            "zoneId": zid,
            "zoneName": next(z["zoneName"] for z in ZONES if z["zoneId"] == zid),
            "uniqueVisitors": len(stats["unique_visitors"]),
            "peakOccupancy": stats["peak_occupancy"],
            "averageDwellTime": round(avg_dwell, 2),
            "totalEntries": stats["total_entries"],
            "totalExits": stats["total_exits"],
            "activityLevel": get_activity_level(stats["peak_occupancy"])
        }
        zone_summaries.append(summary)
        
        if stats["peak_occupancy"] > 0:
            zones_with_activity += 1
        if stats["peak_occupancy"] > highest_occupancy:
            highest_occupancy = stats["peak_occupancy"]
            busiest_zone = zid
    
    # Save outputs
    tracked_out = os.path.join(output_dir, "zone_tracking_test.json")
    activity_out = os.path.join(output_dir, "zone_activity_test.json")
    trans_out = os.path.join(output_dir, "zone_transitions_test.json")
    telemetry_out = os.path.join(output_dir, "retail_intelligence_test.json")
    
    with open(tracked_out, 'w') as f:
        json.dump(all_detections, f, indent=2)
    with open(activity_out, 'w') as f:
        json.dump(zone_summaries, f, indent=2)
    with open(trans_out, 'w') as f:
        json.dump(transitions, f, indent=2)
    with open(telemetry_out, 'w') as f:
        json.dump(telemetry, f, indent=2)
        
    print(f"\n--- RETAIL INTELLIGENCE SUMMARY ---")
    print(f"Frames processed: {frames_processed}")
    print(f"Total unique tracks: {telemetry['summary']['observedUniqueVisitors']}")
    print(f"Total zone transitions: {telemetry['summary']['totalZoneTransitions']}")
    print(f"Zones with activity: {telemetry['summary']['zonesWithActivity']}")
    print(f"Highest observed occupancy: {telemetry['summary']['peakObservedOccupancy']}")
    print(f"Average measurable dwell time: {telemetry['summary']['averageMeasuredDwellTime']}s")
    print(f"Occupancy Snapshots Generated: {len(telemetry['occupancySnapshots'])}")
    print(f"Customer Flow Edges Generated: {len(telemetry['customerFlow'])}")
    print(f"Inference FPS: {fps:.2f}")
    print(f"Aggregation Time: {(agg_end_time - agg_start_time) * 1000:.2f}ms")
    print(f"\nTelemetry saved to {telemetry_out}")
    print("\nExample Customer Flow Edge:")
    if telemetry["customerFlow"]:
        print(json.dumps(telemetry["customerFlow"][0], indent=2))
    else:
        print("None observed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YOLO11n Zone Tracking Prototype")
    parser.add_argument("--source", type=str, required=True, help="Path to input image or video")
    parser.add_argument("--outdir", type=str, default="outputs", help="Directory to save JSON results")
    parser.add_argument("--track", action="store_true", help="Enable ByteTrack tracking")
    parser.add_argument("--save-video", action="store_true", help="Save annotated video output")
    args = parser.parse_args()
    
    run_inference(args.source, args.outdir, use_tracking=args.track, save_video=args.save_video)
