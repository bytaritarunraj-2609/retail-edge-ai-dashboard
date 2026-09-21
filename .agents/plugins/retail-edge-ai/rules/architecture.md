# Retail Edge AI — Architecture Rules

## Project

This is RETAIL EDGE AI — Intelligent Retail Analytics System for SIH 2026.

## Core Pipeline

The intended system architecture is:

CAMERAS
→ EDGE DEVICE
→ YOLO11n DETECTION
→ BYTETrack TRACKING
→ ANALYTICS
→ RETAIL INTELLIGENCE
→ ACTION

The long-term data flow is:

CAMERA
→ FRAME
→ YOLO11n
→ DETECTIONS
→ ByteTrack
→ TRACKED OBJECTS
→ ZONE ANALYTICS
→ RETAIL INTELLIGENCE
→ DASHBOARD

## Current Development Stage

The dashboard is currently being developed before real AI integration.

Current data is MOCK / DEMO data.

Never represent mock data as real AI inference.

Real YOLO11n and ByteTrack integration will be added later.

## Frontend Stack

Use the existing project stack:

- React
- TypeScript
- Vite
- CSS
- Motion
- Recharts
- Lucide React

Do not introduce unnecessary libraries.

## Architecture

Keep the application modular.

Separate:

- pages
- UI components
- types
- mock data
- adapters
- hooks
- business logic
- styles

Do not put the entire application into one file.

## Data Architecture

The UI should communicate through the intelligence data adapter.

Current architecture:

UI
↓
useIntelligence()
↓
IntelligenceDataAdapter
↓
MockIntelligenceAdapter

Future architecture:

UI
↓
useIntelligence()
↓
IntelligenceDataAdapter
↓
LiveIntelligenceAdapter
↓
Real AI Pipeline

Real AI integration must replace the data source without requiring a complete dashboard rewrite.

## Development Rules

Before modifying code:

1. Inspect the existing implementation.
2. Identify the files that actually need to change.
3. Preserve working functionality.
4. Make the smallest clean architectural change.
5. Avoid unnecessary dependencies.

After significant implementation:

- run the TypeScript/build checks
- report what changed
- report whether the build passed

## Important Restrictions

Do not use Lovable.

Do not introduce Google Cloud, AlloyDB, Firebase, or external databases unless explicitly requested.

Do not pretend that mock data comes from real cameras.

Do not pretend that mock data comes from YOLO11n.

Do not randomly change the existing architecture.

Do not delete working features without explicit reason.

The project should remain suitable for later real edge-AI integration.