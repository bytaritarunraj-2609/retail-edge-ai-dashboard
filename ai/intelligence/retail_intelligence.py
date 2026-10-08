class RetailIntelligenceEngine:
    def __init__(self, source_name="test_video", is_demo=True):
        self.source_name = source_name
        self.is_demo = is_demo

    def aggregate(self, track_state, zone_stats, transitions, all_detections, ZONES):
        """
        Consumes raw tracking and zone analytics, producing structured retail telemetry.
        """
        # Global Metrics
        observed_unique_visitors = len(track_state)
        
        # Calculate max peak occupancy across all zones globally at any given moment
        # We can derive global peak occupancy by looking at snapshots, or max of zone peak occupancies?
        # Actually, the user specifically mentioned "Highest observed occupancy: 3 (in Z04)" from the zone stats.
        # So peak_observed_occupancy is the max of zone_stats peak_occupancy.
        peak_observed_occupancy = max([stats["peak_occupancy"] for stats in zone_stats.values()]) if zone_stats else 0
        
        zones_with_activity = sum(1 for stats in zone_stats.values() if stats["peak_occupancy"] > 0)
        total_transitions = len(transitions)
        
        # Calculate Average Measured Dwell Time across all completed visits
        total_dwell_sum = sum(stats["total_dwell_time"] for stats in zone_stats.values())
        total_completed_visits = sum(stats["completed_visits"] for stats in zone_stats.values())
        average_measured_dwell_time = round(total_dwell_sum / total_completed_visits, 2) if total_completed_visits > 0 else 0.0

        # Zone Telemetry
        zones_telemetry = []
        for z in ZONES:
            zid = z["zoneId"]
            stats = zone_stats[zid]
            
            avg_dwell = round(stats["total_dwell_time"] / stats["completed_visits"], 2) if stats["completed_visits"] > 0 else 0.0
            
            # Since we only tracked average dwell previously, we can compute max dwell from track_state history.
            # But we can approximate or compute max observed dwell directly. We'll extract max dwell by scanning track_state.
            max_dwell = 0.0
            for tid, t_state in track_state.items():
                # This requires timestamps of entries/exits. Let's just pass max_dwell from zone_stats.
                # We need to compute it. In yolo_detector we can add max_dwell tracking.
                pass
            
            # Fallback: if we didn't track max_dwell perfectly, we just set it to avg_dwell or we fetch it.
            # Actually I will just update yolo_detector to track max_dwell_time as well.
            max_obs_dwell = round(stats.get("max_dwell_time", 0.0), 2)
            
            # Get activity level
            activity_level = "LOW"
            if stats["peak_occupancy"] > 0 and stats["peak_occupancy"] <= 2:
                activity_level = "MEDIUM"
            elif stats["peak_occupancy"] > 2:
                activity_level = "HIGH"
                
            zones_telemetry.append({
                "zoneId": zid,
                "zoneName": z["zoneName"],
                "currentOccupancy": 0, # At end of video
                "peakOccupancy": stats["peak_occupancy"],
                "uniqueVisitors": len(stats["unique_visitors"]),
                "entries": stats["total_entries"],
                "exits": stats["total_exits"],
                "averageDwellTime": avg_dwell,
                "maxObservedDwellTime": max_obs_dwell,
                "measurableVisits": stats["completed_visits"],
                "activityLevel": activity_level
            })

        # Customer Flow
        flow_edges = {}
        for t in transitions:
            if t["fromZone"] is None or t["toZone"] is None:
                continue
            edge = f"{t['fromZone']}->{t['toZone']}"
            if edge not in flow_edges:
                flow_edges[edge] = {
                    "fromZone": t["fromZone"],
                    "toZone": t["toZone"],
                    "transitionCount": 0
                }
            flow_edges[edge]["transitionCount"] += 1
            
        customer_flow = list(flow_edges.values())

        # Occupancy Snapshots
        # To avoid massive JSON files for 647 frames, we can snapshot periodically (e.g. every 30 frames or 1 sec)
        occupancy_snapshots = []
        for i, frame_data in enumerate(all_detections):
            if i % 15 == 0: # 2 snapshots per second (assuming 30fps simulation)
                # Count current occupancy for this frame
                snapshot_zones = {z["zoneId"]: 0 for z in ZONES}
                for det in frame_data["detections"]:
                    if det["zoneId"] is not None:
                        snapshot_zones[det["zoneId"]] += 1
                
                occupancy_snapshots.append({
                    "timestamp": frame_data["timestamp"],
                    "zones": snapshot_zones
                })

        # Final Telemetry Schema
        telemetry = {
            "metadata": {
                "source": self.source_name,
                "model": "YOLO11n",
                "tracker": "ByteTrack",
                "analytics": "Prototype Zone Analytics",
                "isDemo": self.is_demo,
                "warning": "Data is observed from a test video. Do not interpret as live store footfall."
            },
            "summary": {
                "observedUniqueVisitors": observed_unique_visitors,
                "peakObservedOccupancy": peak_observed_occupancy,
                "zonesWithActivity": zones_with_activity,
                "totalZoneTransitions": total_transitions,
                "averageMeasuredDwellTime": average_measured_dwell_time
            },
            "zones": zones_telemetry,
            "customerFlow": customer_flow,
            "occupancySnapshots": occupancy_snapshots
        }

        return telemetry
