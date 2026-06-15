---
project: Open House Map
version: 0.1.0
status: Phase 1 - Build
created: 2026-06-14
owner: Property Owner
location: 159 Stone Lake Court, Yorktown, VA 23693
methodology: BMAD (Build → Measure → Analyze → Deploy)
---

# Open House Map

Private property and home detail mapper. Allows homeowners to document their land, structures, utilities, and house systems at an architectural detail level — entirely private, entirely local.

## Purpose

Map your property and home with precision:
- **Land**: Parcel boundaries, trees, utilities, driveway, patio, sheds, landscape
- **House**: 3D model with layers (foundation, studs, drywall, wiring, plumbing, insulation, roof)
- **Blueprints**: Upload CAD/blueprint images, annotate and measure
- **Maintenance**: Track repairs, inspections, upgrades over time

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Maps | Leaflet.js (OpenStreetMap tiles) |
| 3D | Three.js (WebGL house model) |
| UI | Vanilla JS, CSS (dark theme) |
| Storage | localStorage (100% private, no cloud) |
| Data | JSON export/import for backup |

## Project Structure

```
open-house-map/
├── index.html           # Main application (SPA)
├── assets/
│   ├── css/
│   │   └── style.css    # Dark theme stylesheet
│   └── js/
│       ├── app.js       # Main application logic
│       └── data.js      # Data store (localStorage)
├── docs/
│   ├── ARCHITECTURE.md  # System architecture
│   ├── BMAD.md          # BMAD methodology
│   └── README.md        # User documentation
├── .bmad/
│   ├── build.md         # Build phase notes
│   ├── measure.md       # Measure phase notes
│   ├── analyze.md       # Analyze phase notes
│   └── deploy.md        # Deploy phase notes
└── SKILL.md             # Project skill
```

## Key Design Principles

1. **Privacy First** — All data stays in browser localStorage. Export to JSON for backup.
2. **Open Standards** — Uses OSM, WebGL (Three.js), standard JSON, PNG/JPG.
3. **Extensible** — Can add blueprints, 3D house model, maintenance log, more.
4. **Layered** — Map layers, house layers (slab → studs → drywall → roof).

## Current Status

**Phase 1: Build** — Initial prototype with map, basic features, 3D house model.

## Next Steps

1. Walk through BMAD phases (see `.bmad/`)
2. User provides blueprint scans
3. Integrate blueprints into 3D house model
4. Add parcel boundary from GIS data
5. Add more detail layers
