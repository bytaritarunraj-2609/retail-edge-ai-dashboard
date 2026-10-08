# Retail Edge AI — AI Pipeline Rules

## Core System

The intended Retail Edge AI pipeline is:

CAMERA
→ FRAME
→ YOLO11n
→ DETECTIONS
→ ByteTrack
→ TRACKED OBJECTS
→ ZONE ANALYTICS
→ RETAIL INTELLIGENCE
→ ACTION

The dashboard should visually communicate this architecture where appropriate.

---

## YOLO11n

YOLO11n is the intended object detection model.

YOLO answers:

"WHAT is present?"

Examples include:

- person
- product
- retail object
- shelf item

YOLO is responsible for detection.

Do not describe YOLO as the tracking system.

---

## ByteTrack

ByteTrack is the intended object tracking system.

ByteTrack answers:

"WHICH detected object continues across frames?"

ByteTrack associates detections across frames to maintain object identities.

Do not describe ByteTrack as an object detector.

---

## Current Prototype

The current dashboard uses mock/demo data.

Real YOLO11n and ByteTrack inference are NOT currently connected.

Never claim that a mock event came from real YOLO inference.

Never claim that a mock tracking event came from real ByteTrack inference.

Use explicit terminology such as:

- DEMO DATA
- SIMULATED EDGE AI
- SIMULATED
- PROTOTYPE

when representing simulated AI activity.

---

# Camera System

The prototype represents 20 cameras.

Each camera corresponds to a shelf/zone.

The system must support:

- 20 total cameras
- exactly 4 actively processing cameras at a time
- 16 cameras inactive/waiting when 4 are active

Camera indicators must remain visually associated with their corresponding shelves.

Do not create disconnected floating camera indicators.

---

# Camera Resource Optimization

The purpose of the camera scheduling system is to optimize limited edge-compute resources.

The system should prioritize zones based on activity.

Priority:

HIGH
>
MEDIUM
>
LOW

High-activity zones should receive processing more frequently.

Low-activity zones should receive processing less frequently.

The scheduling system must be deterministic.

Do not randomly switch cameras.

---

# Camera Lifecycle

A camera may move through this lifecycle:

INACTIVE
→ QUEUED
→ PROCESSING
→ CAPTURING
→ ANALYZING
→ COMPLETE
→ INACTIVE

The UI should make the current camera state understandable.

Possible semantic meanings:

INACTIVE
- camera is not currently consuming active edge-processing resources

QUEUED
- camera has been selected for upcoming processing

PROCESSING
- edge device is processing the camera task

CAPTURING
- frame/image capture is occurring

ANALYZING
- AI analysis is occurring

COMPLETE
- analysis cycle has completed

---

# Four-Camera Rule

Exactly four cameras should be active at the same time in the prototype.

When one processing cycle finishes, another camera can enter the active set according to the scheduling priority.

The transition should appear intentional and coordinated.

Do not show five or more active cameras simultaneously.

Do not accidentally show zero active cameras during normal operation.

---

# Camera Rotation

Camera rotation should be periodic.

The manager should be able to see:

CURRENT ACTIVE CAMERAS

and preferably:

NEXT PRIORITY CAMERAS

The next cameras should be selected based on zone activity and priority rather than random selection.

The rotation should be deterministic so that the same state can be reproduced during demonstrations.

---

# Shelf Relationship

Every shelf owns exactly one camera.

The relationship is:

SHELF
↕
CAMERA
↓
EDGE PROCESSING
↓
AI ANALYSIS
↓
INVENTORY INSIGHT

The camera indicator should appear directly on or immediately beside its shelf panel.

Never separate the camera status from the shelf it monitors.

---

# Inventory States

Shelf inventory can have these states:

NORMAL
RESTOCK
OUT_OF_STOCK
MISPLACED

Meaning:

NORMAL
- expected inventory condition

RESTOCK
- stock is low and replenishment is required

OUT_OF_STOCK
- expected product is unavailable

MISPLACED
- an item appears to be in the wrong shelf/location

Use semantic visual treatment for each state.

Do not rely only on color.

---

# Camera OFF Does Not Mean No Data

An inactive camera does NOT mean the shelf has no information.

It means:

"The zone is not currently consuming active edge-processing resources."

The dashboard should continue displaying the last known shelf/inventory state.

For example:

Camera OFF
+
Last scan: 02:14 PM
+
Shelf state: RESTOCK

is valid.

---

# Mock Inventory Updates

The prototype may simulate inventory changes after a camera analysis cycle.

For example:

Before scan:
NORMAL

Simulated analysis:
LOW STOCK DETECTED

After scan:
RESTOCK

These transitions must be clearly understood as simulated prototype behavior.

Do not imply that a physical camera or real AI model performed the analysis.

---

# Shelf Detail Information

Clicking a shelf should allow the manager to inspect relevant information.

The detail view may include:

- Shelf ID
- Camera ID
- Zone
- Product
- Current Stock
- Shelf Status
- Camera Status
- Activity Level
- Last Scan
- Last Analysis
- Detection Count
- Track Count
- Insight / Reason

Only display fields that actually exist in the application's data model.

Do not fabricate live measurements.

---

# Store Manager Mental Model

The manager should be able to understand:

WHAT IS HAPPENING?

→ Which shelves need attention?

WHICH CAMERA IS ACTIVE?

→ Which zones are currently consuming edge resources?

WHY IS IT ACTIVE?

→ What is the activity/priority reason?

WHAT DID AI FIND?

→ What inventory or shopper insight resulted?

WHAT SHOULD I DO?

→ What action is required?

---

# Future Real AI Integration

The eventual architecture should allow:

CAMERA
→ REAL FRAME
→ YOLO11n
→ REAL DETECTIONS
→ ByteTrack
→ REAL TRACKS
→ ANALYTICS
→ DASHBOARD

The dashboard should not need to be rewritten when real inference is introduced.

The preferred approach is to replace or extend the data adapter.

Current:

UI
↓
useIntelligence()
↓
IntelligenceDataAdapter
↓
MockIntelligenceAdapter

Future:

UI
↓
useIntelligence()
↓
IntelligenceDataAdapter
↓
LiveIntelligenceAdapter
↓
YOLO11n + ByteTrack

---

# Accuracy and Honesty

Never invent real-world AI results.

Never claim:

"YOLO detected 12 people"

unless the application actually received that result from YOLO.

For prototype demonstrations, use:

"SIMULATED EDGE AI"

or

"DEMO DATA"

instead.

The UI should communicate the intended future architecture without pretending that future components are already operational.

---

# Performance

Do not create unnecessary continuous processing simulations.

Camera scheduling simulations should be lightweight.

Prefer:

- timers where appropriate
- React state
- deterministic scheduling
- CSS transitions
- controlled motion

Avoid:

- unnecessary WebGL
- Three.js
- continuous canvas rendering
- excessive JavaScript animation loops

The dashboard must remain responsive.