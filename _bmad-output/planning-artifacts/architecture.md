# Architecture Document - OpenHouseMap

## 1. System Architecture

### 1.1 Overview
OpenHouseMap is a client-side web application that provides property and home detail mapping. The architecture follows a single-page application (SPA) pattern with local data persistence.

### 1.2 Architectural Pattern
**Pattern:** Client-Side SPA with Local Storage  
**Rationale:** 
- Privacy-first approach - all data stays on user's device
- No backend infrastructure required
- Works offline after initial load
- Simple deployment (GitHub Pages)

### 1.3 Technology Stack
```
Frontend:
├── HTML5 (Semantic markup)
├── CSS3 (Custom properties, Grid, Flexbox)
├── JavaScript ES2020+ (ES Modules)
├── Leaflet.js (2D mapping)
├── Three.js (3D visualization)
└── LocalStorage (Data persistence)
```

## 2. Component Architecture

### 2.1 Core Components

```
OpenHouseMap/
├── index.html                    # Property map view
├── floor_plan.html              # 2D floor plan view
├── 3d_model.html                # 3D house visualization
├── structural_model.html        # Structural details view
├── docs/
│   └── index.html               # GitHub Pages landing page
├── assets/
│   ├── css/                     # Stylesheets
│   ├── js/                      # JavaScript modules
│   └── data/                    # JSON data files
├── _bmad/                       # BMAD methodology
├── _bmad-output/                # BMAD artifacts
│   ├── planning-artifacts/
│   │   ├── prd.md
│   │   └── architecture.md
│   ├── implementation-artifacts/
│   │   └── sprint-status.yaml
│   └── project-context.md
└── .github/
    └── workflows/
        └── deploy.yml           # GitHub Actions
```

### 2.2 Data Architecture

#### Data Models
```typescript
// Property Feature
interface PropertyFeature {
  id: string;
  name: string;
  type: string;           // 'building', 'tree', 'utility', 'boundary'
  coordinates: GeoPoint;  // {lat, lng}
  dimensions?: {          // For buildings/structures
    width: number;
    depth: number;
    height?: number;
  };
  provenance: 'OSM' | 'OWNER';
  versions: FeatureVersion[];
  metadata: Record<string, any>;
}

// Feature Version
interface FeatureVersion {
  version: number;
  timestamp: string;
  changeset: string;
  data: Partial<PropertyFeature>;
  changeDescription: string;
}

// Changeset
interface Changeset {
  id: string;
  timestamp: string;
  features: string[];     // Feature IDs affected
  description: string;
}

// House Room
interface HouseRoom {
  id: string;
  name: string;
  dimensions: { width: number; depth: number; };
  features: RoomFeature[];
  electrical: ElectricalCircuit[];
  plumbing: PlumbingFixture[];
  walls: WallConstruction;
}
```

#### Storage Strategy
```
localStorage Schema:
├── ohm:propertyFeatures      // Array of all property features
├── ohm:houseData             // House room and structural data
├── ohm:changesets            // All changeset records
├── ohm:currentView           // Last viewed map coordinates
├── ohm:settings              // User preferences
└── ohm:versionHistory        // Feature version tracking
```

## 3. Module Architecture

### 3.1 Mapping Module (Leaflet)
```javascript
// Responsibilities:
// - Display OpenStreetMap tiles
// - Render property boundary polygon
// - Handle user interactions (click, zoom, pan)
// - Manage feature markers and popups
// - Track changes and create version history

Key Classes:
├── MapManager
├── PropertyLayer
├── FeatureLayer
├── VersionHistory
└── SnapshotManager
```

### 3.2 Floor Plan Module
```javascript
// Responsibilities:
// - Parse blueprint dimensions
// - Render 2D floor plan with accurate proportions
// - Handle room selection and detail display
// - Manage electrical/plumbing overlays

Key Classes:
├── FloorPlanRenderer
├── RoomManager
├── OverlayManager
└── DimensionCalculator
```

### 3.3 3D Visualization Module (Three.js)
```javascript
// Responsibilities:
// - Generate 3D model from floor plan data
// - Handle camera controls and navigation
// - Render architectural details
// - Support multiple view modes

Key Classes:
├── SceneBuilder
├── ModelGenerator
├── CameraController
└── ViewModeManager
```

### 3.4 Data Management Module
```javascript
// Responsibilities:
// - LocalStorage CRUD operations
// - Data validation
// - Export/Import functionality
// - Version control logic

Key Classes:
├── DataStore
├── VersionController
├── ExportManager
└── DataValidator
```

## 4. Integration Architecture

### 4.1 View Navigation
```
Main Navigation Flow:
index.html (Property Map)
├── Floor Plan View → floor_plan.html
├── 3D Model View → 3d_model.html
├── Structural View → structural_model.html
└── Landing Page → docs/index.html
```

### 4.2 Data Flow
```
User Input → Data Validation → LocalStorage → UI Update
     ↓
Version History Tracking
     ↓
Changeset Creation
     ↓
Optional Export/Import
```

### 4.3 External Dependencies
```
CDN Dependencies:
├── Leaflet 1.9.4 (CSS + JS)
├── Three.js r128 (Core + OrbitControls + GLTFLoader)
└── No backend dependencies
```

## 5. Security Architecture

### 5.1 Data Privacy
- **All data stored locally** in localStorage
- **No network requests** for data storage
- **No analytics or tracking**
- **User-controlled export** only

### 5.2 Code Security
- **No eval() or innerHTML with user data**
- **Input validation** on all user-provided data
- **Content Security Policy** (if deployed)
- **Safe DOM manipulation**

## 6. Performance Architecture

### 6.1 Optimization Strategies
```
Load Time:
├── Minimal initial payload (~100KB)
├── CDN-hosted dependencies
└── Gzip compression on GitHub Pages

Runtime:
├── Efficient localStorage operations
├── Debounced user interactions
├── RequestAnimationFrame for 3D rendering
└── Memory cleanup for large datasets
```

### 6.2 Scalability Considerations
- Current design supports 1 property with detailed house data
- Could extend to multiple properties with workspace abstraction
- 3D model complexity scales with detail level (LOD possible)

## 7. Deployment Architecture

### 7.1 GitHub Pages
```yaml
# Configuration
Source: docs/ folder
Branch: main
Framework: Static site

# URL Pattern
https://wallyatkins.github.io/OpenHouseMap/
```

### 7.2 CI/CD Pipeline
```yaml
# GitHub Actions Workflow
Events:
├── Push to main → Deploy to GitHub Pages
└── Manual trigger → Redeploy

Steps:
1. Validate build (no compilation needed)
2. Deploy docs/index.html and assets
3. Verify deployment
```

## 8. Future Architecture Considerations

### 8.1 Potential Enhancements
- **Multi-property support** with workspace switching
- **Cloud backup option** with end-to-end encryption
- **Mobile app** (React Native or PWA)
- **CAD file import** with professional parser
- **Team collaboration** (property managers, contractors)

### 8.2 Technical Debt Items
- Refactor to ES6 modules for better organization
- Add unit tests for data management logic
- Implement progressive enhancement
- Add accessibility improvements (ARIA, keyboard nav)

## 9. Design Decisions

### 9.1 Why No Backend?
- Privacy requirements demand local-only storage
- Simplifies deployment and maintenance
- Reduces cost to zero
- Owner has complete control of their data

### 9.2 Why Leaflet + Three.js?
- Leaflet: Industry standard, well-documented, lightweight
- Three.js: Most capable WebGL library, good documentation
- Both have large communities for support
- No framework overhead needed

### 9.3 Why localStorage?
- Sufficient for property-scale data (< 10MB typical)
- Built into browsers, no configuration needed
- Works offline by default
- Easy to export/import as JSON

## 10. Architecture Decision Records

### ADR-001: Use localStorage for Data Persistence
**Status:** Accepted  
**Context:** Need private, offline data storage  
**Decision:** Use browser localStorage  
**Consequences:** 
- ✅ No backend needed
- ✅ Works offline
- ❌ Limited to ~5-10MB per domain
- ❌ No sync across devices without export/import

### ADR-002: Single-Page Application Architecture
**Status:** Accepted  
**Context:** Need separate views for map, floor plan, 3D model  
**Decision:** Use separate HTML files with shared data  
**Consequences:**
- ✅ Simple deployment
- ✅ Easy to navigate
- ❌ Duplicate code across files
- ⚠️ State sharing between pages requires localStorage

### ADR-003: Vanilla JavaScript Over Framework
**Status:** Accepted  
**Context:** Need lightweight, maintainable code  
**Decision:** Use vanilla JS with ES6 modules  
**Consequences:**
- ✅ No build step needed
- ✅ Easy to debug
- ✅ Minimal dependencies
- ❌ Less boilerplate protection
- ❌ Need to manage state manually

## 11. Approval
- **Architect:** [To be assigned]
- **Product Manager:** wallyatkins
- **Date:** 2026-06-16
