# Retail Edge AI — Store Map Skill

## Purpose

Build and maintain the Retail Edge AI Store Map as a digital store twin and edge-camera resource monitor.

The Store Map is NOT a generic collection of cards.

It should communicate:

SHELF
→ CAMERA
→ EDGE PROCESSING
→ AI ANALYSIS
→ INVENTORY INTELLIGENCE

The manager should immediately understand which shelves exist, which cameras are active, what each shelf contains, and which zones require attention.

---

# Before Making Changes

Always inspect the current implementation first.

At minimum inspect:

- `src/pages/MapPage.tsx`
- `src/types/index.ts`
- `src/data/mockData.ts`
- `src/hooks/useIntelligence.ts`
- `src/components/ui/Glass.tsx`
- `src/styles/global.css`

Also inspect any existing camera/shelf scheduling logic before creating new logic.

Do not assume files exist.

Do not replace working architecture unnecessarily.

---

# Store Map Structure

The prototype represents:

- 20 shelves
- 20 shelf cameras
- exactly 4 active cameras at one time

Organize the store spatially.

The map should feel like a simplified digital retail store rather than a random card grid.

Shelves should have clear spatial relationships.

Possible structure:

- aisle groups
- shelf rows
- zone labels
- camera indicators
- operational status

The exact visual layout may evolve, but it must remain organized and easy to understand.

---

# Shelf-Camera Relationship

Every shelf owns exactly one camera.

For example:

Shelf 01
→ Camera 01

Shelf 02
→ Camera 02

...

Shelf 20
→ Camera 20

The camera state must be displayed directly on or immediately beside the shelf panel.

DO NOT create floating camera dots disconnected from shelves.

The user must never have to guess which shelf a camera belongs to.

---

# Camera States

Supported camera states:

- INACTIVE
- QUEUED
- PROCESSING
- CAPTURING
- ANALYZING
- COMPLETE

The most important visual distinction is:

ACTIVE / PROCESSING

versus:

INACTIVE

The active state should be immediately visible without dominating the interface.

Use semantic visual treatment consistent with the existing design system.

---

# Four Active Cameras

Exactly four cameras are active at any normal point in the prototype.

Example:

ACTIVE:
Camera 03
Camera 07
Camera 12
Camera 18

INACTIVE:
all remaining cameras

Do not accidentally render five active cameras.

Do not accidentally render zero active cameras.

The four active cameras should rotate periodically.

---

# Camera Scheduling

Camera selection should be based on zone activity.

Priority:

HIGH
>
MEDIUM
>
LOW

High-activity zones should be processed more frequently.

Low-activity zones should be processed less frequently.

The scheduling system must be deterministic.

DO NOT use uncontrolled random camera switching.

The same initial state should be reproducible.

If scheduling logic is needed, isolate it into a reusable hook such as:

`useCameraScheduler.ts`

Do not bury complex scheduling logic inside `MapPage.tsx`.

---

# Camera Lifecycle

The preferred lifecycle is:

INACTIVE
→ QUEUED
→ PROCESSING
→ CAPTURING
→ ANALYZING
→ COMPLETE
→ INACTIVE

The UI should communicate these transitions naturally.

Avoid abrupt visual changes.

Use existing Motion and Glass patterns.

---

# Camera Rotation Visualization

The Store Map should make the resource optimization visible.

The manager should be able to understand:

CURRENT ACTIVE CAMERAS

and preferably:

NEXT PRIORITY CAMERAS

A compact resource summary may show:

4 / 20 ACTIVE

and:

NEXT:
Camera XX
Camera XX
Camera XX
Camera XX

Do not overwhelm the map with technical information.

---

# Shelf States

Every shelf should have an inventory state.

Supported states:

NORMAL
RESTOCK
OUT_OF_STOCK
MISPLACED

Meaning:

NORMAL
The shelf is operating normally.

RESTOCK
Stock is low and replenishment is required.

OUT_OF_STOCK
The expected product is unavailable.

MISPLACED
An item appears to be in the wrong location.

These states must be visually distinct.

Do not rely only on color.

Use combinations of:

- state label
- icon
- border
- indicator
- supporting text

---

# Camera OFF Semantics

An inactive camera does NOT mean that the shelf has no data.

It means:

"The zone is not currently consuming active edge-processing resources."

The shelf should continue displaying its last known inventory state.

Example:

Camera:
INACTIVE

Last Scan:
02:14 PM

Shelf State:
RESTOCK

This is valid.

Do not hide inventory information simply because a camera is inactive.

---

# Shelf Panel

Each shelf should be represented by a clear panel.

A shelf panel should communicate at least:

- Shelf ID
- Product
- Inventory state
- Camera ID
- Camera state
- Activity level
- Last scan

Keep the primary state visually dominant.

Technical metadata should be secondary.

---

# Shelf Interaction

Every shelf should be clickable.

Clicking a shelf should open a detail drawer or panel.

The detail view should include relevant information such as:

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

Only show data that actually exists in the application state.

Do not invent live values.

---

# Detail Drawer Behavior

The drawer should feel connected to the selected shelf.

Preferred interaction:

1. shelf receives interaction highlight
2. detail panel opens
3. panel moves slightly toward the user
4. opacity increases
5. glass blur settles
6. content appears
7. panel settles into place

Use the existing Liquid Glass system.

Do not create a completely different modal style.

---

# Mock AI Behavior

The Store Map currently uses simulated data.

It may simulate:

camera activation
→ frame capture
→ analysis
→ inventory update
→ camera deactivation

For example:

Camera 03
→ CAPTURING
→ ANALYZING
→ SIMULATED LOW STOCK
→ Shelf 03 becomes RESTOCK
→ Camera 03 becomes COMPLETE
→ Camera 03 becomes INACTIVE

All such behavior is prototype simulation.

Use terminology such as:

SIMULATED EDGE AI

or:

DEMO DATA

Do not claim that a physical camera or real YOLO11n model generated the result.

---

# Visual Design

Reuse the existing Liquid Glass design system.

The Store Map should feel:

- premium
- cinematic
- organized
- technical
- calm
- intelligent

Use:

- translucent glass
- subtle reflections
- controlled depth
- restrained highlights
- meaningful motion
- semantic state indicators

Avoid:

- random floating elements
- excessive neon
- excessive glow
- giant cards
- flat opaque panels
- unnecessary 3D
- Three.js
- decorative effects without information value

---

# Store Map Hierarchy

The visual hierarchy should generally be:

1. Store Map / Store Twin
2. Shelf states
3. Active camera states
4. Resource utilization
5. Zone activity
6. Shelf metadata
7. Technical metadata

The manager should understand operational status before technical details.

---

# Responsiveness

Desktop and laptop are the primary targets.

The map must remain usable at smaller widths.

Do not allow:

- shelf overlap
- unreadable labels
- broken drawer positioning
- overflowing camera indicators
- inaccessible controls

The spatial relationship between shelf and camera must remain intact at all supported widths.

---

# Architecture

Keep Store Map presentation separate from scheduling/business logic.

Preferred structure:

MapPage
↓
Store Map Components
↓
Camera/Shelf State
↓
Camera Scheduler
↓
Intelligence Data Adapter

If new components are needed, prefer modular components such as:

- StoreMap
- ShelfPanel
- CameraIndicator
- ZoneLabel
- CameraResourceSummary
- ShelfDetailDrawer

Do not create unnecessary components if the existing architecture already provides a clean equivalent.

---

# Data Ownership

Mock data should remain separate from UI presentation.

Do not hardcode large datasets directly into JSX.

Prefer centralized mock data or derived state.

If the Store Map requires new types, add them to the existing type system rather than using uncontrolled `any` objects.

Maintain strict TypeScript.

---

# Verification Checklist

Before considering the Store Map complete, verify:

[ ] 20 shelves are rendered.

[ ] 20 corresponding cameras exist.

[ ] Every camera is visually associated with its shelf.

[ ] No disconnected floating camera dots exist.

[ ] Exactly 4 cameras are active.

[ ] The active set rotates periodically.

[ ] Rotation is deterministic.

[ ] Activity level influences camera priority.

[ ] High-activity zones receive priority.

[ ] Shelf states include NORMAL, RESTOCK, OUT_OF_STOCK and MISPLACED.

[ ] Camera OFF does not hide the last known shelf state.

[ ] Clicking a shelf opens its detail information.

[ ] Detail information is tied to the selected shelf.

[ ] Mock AI activity is clearly identified as simulated.

[ ] Existing Glass styling is preserved.

[ ] Existing dashboard architecture is preserved.

[ ] No unnecessary cloud/database integration is introduced.

[ ] No unnecessary dependency is introduced.

[ ] TypeScript/build checks pass.

[ ] Existing Overview functionality remains intact.

---

# Final Principle

The Store Map should make the edge-AI resource optimization understandable visually.

The manager should be able to see:

20 CAMERAS
↓
4 ACTIVE
↓
ACTIVITY-BASED PRIORITY
↓
PERIODIC PROCESSING
↓
SHELF ANALYSIS
↓
INVENTORY INSIGHT
↓
ACTION

The Store Map is a digital operational model of the retail store, not merely a decorative visualization.