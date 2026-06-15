# Architecture — Open House Map

## System Overview

Open House Map is a client-side Progressive Web App (PWA) for private property documentation. It runs entirely in the browser with no server dependency.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Open House Map                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Map View  │  │   3D View   │  │ Blueprint   │     │
│  │ (Leaflet)   │  │ (Three.js)  │  │  Viewer     │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│  ┌──────▼────────────────▼────────────────▼──────┐     │
│  │              Data Store Layer                  │     │
│  │           (localStorage + JSON)                │     │
│  ├────────────────────────────────────────────────┤     │
│  │ • property       • features      • blueprints  │     │
│  │ • maintenance    • notes         • settings    │     │
│  └────────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Map View (Leaflet.js)
- Uses OpenStreetMap tiles
- Supports aerial imagery (ESRI World Imagery)
- Layer control for: parcel, utilities, structures, landscape
- Features stored as GeoJSON with custom markers
- Click-to-add feature workflow

### 2. 3D House Model (Three.js)
- WebGL-based 3D visualization
- Layer-based visibility control:
  - Foundation slab
  - Floor plan
  - Walls/studs
  - Roof/trusses
  - Electrical wiring
  - Plumbing pipes
  - HVAC ducts
  - Insulation
  - Windows/doors
- Mouse interaction: drag to rotate, scroll to zoom

### 3. Blueprint Viewer
- Canvas-based image viewer
- Supports PNG, JPG, SVG
- Thumbnail gallery for multiple blueprints
- Upload from local files
- Future: measurement and annotation tools

### 4. Maintenance Log
- CRUD operations for maintenance entries
- Categories: roof, electrical, plumbing, hvac, etc.
- Status tracking: planned, in-progress, completed
- Cost tracking and scheduling

### 5. Data Layer
- localStorage for persistence
- JSON export/import for backup
- Structured schema with validation

## Data Model

### Property
```javascript
{
  address: string,
  city: string,
  lat: number,
  lng: number,
  lotSize: string,
  yearBuilt: string,
  livingArea: string,
  stories: string,
  foundation: string,
  roofType: string,
  exterior: string,
  notes: string
}
```

### Feature
```javascript
{
  id: string,
  name: string,
  category: string,
  lat: number,
  lng: number,
  material: string,
  year: string,
  notes: string
}
```

### Maintenance Entry
```javascript
{
  id: string,
  title: string,
  category: string,
  date: string,
  status: string,
  cost: number,
  nextDue: string,
  notes: string
}
```

### Blueprint
```javascript
{
  id: string,
  name: string,
  data: string (base64),
  uploadedAt: string
}
```

## Standards Used

- **Maps**: OpenStreetMap (OSM) — free, open, community-driven
- **3D Rendering**: Three.js (WebGL) — open standard, no plugins
- **Data Format**: JSON — universal, human-readable
- **UI**: CSS Custom Properties — maintainable, themeable
- **Storage**: localStorage — browser-native, private

## Privacy Model

1. All data stored in browser localStorage
2. No network requests to data collection services
3. Tile providers (OSM, ESRI) receive IP addresses (standard)
4. Export to JSON file for backup (user-controlled)
5. No cloud sync, no analytics, no telemetry

## Future Architecture Considerations

### Potential Additions
- GIS integration for parcel boundaries
- PDF/DWG blueprint parsing
- Photogrammetry for 3D house model
- Cloud sync (optional, encrypted)
- Mobile app (PWA installable)

### Extensibility Points
- Plugin system for custom layers
- Web Components for modular UI
- Service Worker for offline support
- IndexedDB for larger datasets
