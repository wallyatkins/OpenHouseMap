# Product Requirements Document (PRD) - OpenHouseMap

## 1. Product Overview
**Product Name:** OpenHouseMap  
**Product Manager:** wallyatkins  
**Version:** 1.0.0  
**Status:** Planning  
**Last Updated:** 2026-06-16

OpenHouseMap is a private property and home detail mapping tool that allows homeowners to create detailed, layered maps of their property and home at an architectural level of detail. Unlike public mapping services, this tool is designed for private use, enabling owners to track everything from property boundaries to individual studs, wires, and fixtures within their home.

## 2. Problem Statement
Homeowners lack a comprehensive, private tool to:
- Map their property at parcel-level detail
- Record and visualize structural elements (utilities, foundation, framing)
- Create 3D models of their homes from blueprints
- Track maintenance, warranties, and renovations over time
- Keep sensitive property data private and under their control

## 3. Goals and Objectives
### Primary Goals
- Enable property owners to create detailed, versioned maps of their land
- Allow integration of blueprints/CAD drawings into interactive floor plans
- Provide 3D visualization of homes from architectural plans
- Support maintenance tracking and warranty management
- Keep all data private and under owner control

### Success Metrics
- Users can upload blueprints and see them positioned on property maps
- Users can navigate 3D house models interactively
- Users can track at least 5 types of property features
- All data remains stored locally on user's device
- Zero data shared with third parties

## 4. User Personas
### Primary Persona: Homeowner/Property Owner
- **Name:** wallyatkins (wally)
- **Age:** 40-60
- **Tech Level:** Comfortable with modern web applications
- **Needs:** Understand their property, maintain their home, plan renovations
- **Pain Points:** Scattered documentation, no single source of truth for property details

### Secondary Persona: Property Investor/Rental Owner
- **Name:** Multiple property owner
- **Needs:** Track maintenance across multiple properties, document conditions
- **Pain Points:** Managing information for multiple properties is cumbersome

## 5. User Stories

### Property Mapping
- **As a** property owner, **I want to** see my property boundary on a map, **so that** I know exactly where my land starts and ends.
- **As a** property owner, **I want to** mark locations of utilities (electrical, water, gas) on my property, **so that** I know where to avoid when digging.
- **As a** property owner, **I want to** record tree locations and sizes, **so that** I can plan maintenance and landscaping.

### House Documentation
- **As a** homeowner, **I want to** upload my house blueprints, **so that** I can create an interactive floor plan.
- **As a** homeowner, **I want to** see a 3D model of my house, **so that** I can visualize renovations before making them.
- **As a** homeowner, **I want to** click on any room to see its dimensions, fixtures, and features, **so that** I have quick access to property details.

### Structural Information
- **As a** homeowner, **I want to** see the foundation type, wall construction, and roofing materials, **so that** I understand my home's structure.
- **As a** homeowner, **I want to** locate my electrical panel, water heater, and HVAC systems, **so that** I can perform maintenance and emergencies.
- **As a** homeowner, **I want to** see insulation R-values and window types, **so that** I can plan energy efficiency improvements.

### Maintenance Tracking
- **As a** homeowner, **I want to** record when appliances were installed and their warranty information, **so that** I can claim warranties before they expire.
- **As a** homeowner, **I want to** track past renovations and upgrades, **so that** I understand the history of my property.
- **As a** homeowner, **I want to** receive reminders for maintenance tasks, **so that** I keep my property in good condition.

## 6. Requirements

### Functional Requirements
#### FR-1: Property Map Integration
- **FR-1.1:** System shall integrate with OpenStreetMap to display property boundaries
- **FR-1.2:** System shall allow users to mark custom features on the property map
- **FR-1.3:** System shall support versioning of all property changes with provenance tracking

#### FR-2: Floor Plan Generation
- **FR-2.1:** System shall allow users to upload blueprint images or PDFs
- **FR-2.2:** System shall convert blueprints into interactive 2D floor plans
- **FR-2.3:** System shall display room dimensions and features when users click on rooms

#### FR-3: 3D House Model
- **FR-3.1:** System shall generate 3D models from floor plan dimensions
- **FR-3.2:** System shall allow users to rotate, zoom, and pan the 3D model
- **FR-3.3:** System shall support different view modes (3D, floor plan, wireframe, X-ray)
- **FR-3.4:** System shall show architectural details (doors, windows, walls, roof)

#### FR-4: Structural Information
- **FR-4.1:** System shall display foundation details (type, piers, footings)
- **FR-4.2:** System shall show wall construction layers (studs, insulation, siding)
- **FR-4.3:** System shall document fireplace and chimney specifications
- **FR-4.4:** System shall track utility locations and connections

#### FR-5: Maintenance Tracking
- **FR-5.1:** System shall allow users to record appliance installation dates
- **FR-5.2:** System shall store warranty information for major systems
- **FR-5.3:** System shall track renovation history with dates and costs

### Non-Functional Requirements
#### NFR-1: Privacy
- **NFR-1.1:** All property data shall be stored locally on the user's device
- **NFR-1.2:** No data shall be transmitted to third-party servers
- **NFR-1.3:** Users control all data sharing decisions

#### NFR-2: Performance
- **NFR-2.1:** 2D property maps shall load in under 2 seconds
- **NFR-2.2:** 3D models shall render at 30+ FPS on modern devices
- **NFR-2.3:** System shall work offline after initial load

#### NFR-3: Usability
- **NFR-3.1:** Interface shall be intuitive for users with minimal technical experience
- **NFR-3.2:** System shall provide tooltips and help documentation
- **NFR-3.3:** System shall be responsive across desktop and tablet devices

#### NFR-4: Data Management
- **NFR-4.1:** System shall support export/import of property data
- **NFR-4.2:** System shall maintain version history of all changes
- **NFR-4.3:** System shall allow users to revert to previous versions

## 7. Technical Architecture
### Frontend
- **HTML5/CSS3/JavaScript** - Core web technologies
- **Leaflet.js** - 2D mapping library for property visualization
- **Three.js** - 3D rendering library for house models
- **localStorage** - Client-side data persistence

### Data Flow
1. User uploads property information and blueprints
2. Data is processed and stored in localStorage
3. Map and 3D views render from stored data
4. Changes are versioned and tracked
5. Users can export data for backup or sharing

### Versioning System
- Each property feature carries full version history
- Changesets group related edits together
- Snapshots capture complete state at specific points
- Source tracking distinguishes between OSM data and user additions
- Provenance badges show 🌐 OSM vs 👤 Owner origin

## 8. Milestones and Timeline

### Phase 1: Foundation (Complete)
- [x] OSM property map integration
- [x] Versioning system with provenance
- [x] Feature management (add/delete/edit)
- [x] Snapshot and export capabilities

### Phase 2: Blueprint Integration (Complete)
- [x] 2D floor plan from blueprints
- [x] Interactive room navigation
- [x] Room detail displays
- [x] Electrical and plumbing overlays

### Phase 3: 3D Visualization (Complete)
- [x] 3D house model generation
- [x] Interactive camera controls
- [x] Multiple view modes
- [x] Architectural details

### Phase 4: Structural Information (Complete)
- [x] Foundation system details
- [x] Wall construction layers
- [x] Fireplace documentation
- [x] Structural view modes

### Phase 5: Advanced Features (In Progress)
- [ ] Advanced utility mapping
- [ ] Photo integration
- [ ] Maintenance tracking
- [ ] Property data export

### Phase 6: Polish and Launch (Future)
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Comprehensive documentation
- [ ] User testing and feedback

## 9. Risks and Mitigations

### Technical Risks
- **Risk:** Large 3D models may cause performance issues on low-end devices
  - **Mitigation:** Implement level-of-detail (LOD) rendering and LOD-based geometry
- **Risk:** Browser compatibility may vary across platforms
  - **Mitigation:** Test on major browsers and provide fallbacks

### User Experience Risks
- **Risk:** Complex interface may overwhelm non-technical users
  - **Mitigation:** Progressive disclosure of features, guided tours
- **Risk:** Users may find data entry cumbersome
  - **Mitigation:** Pre-populated templates, smart defaults

## 10. Open Questions
1. Should we support CAD file import directly, or only through image conversion?
2. What's the maximum property size we should support for 3D rendering?
3. Should we offer cloud backup as an optional feature (with encryption)?
4. How should we handle multi-story homes?

## 11. Approval
- **Product Manager:** wallyatkins
- **Technical Lead:** [Pending]
- **Stakeholder:** wallyatkins
- **Date:** 2026-06-16
