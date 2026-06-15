# BUILD Phase — Open House Map

## Status: Phase 1 (Current)

### Completed
- [x] Project structure created
- [x] BMAD methodology documented
- [x] Architecture documentation written
- [x] Map view with Leaflet + OpenStreetMap
- [x] 3D house model with Three.js
- [x] Blueprint viewer with canvas
- [x] Maintenance log system
- [x] Data layer with localStorage
- [x] JSON export/import
- [x] Dark theme UI

### In Progress
- [ ] User testing with actual property data
- [ ] Blueprint integration with real blueprints

### Pending
- [ ] Parcel boundary integration from GIS
- [ ] Advanced 3D features (cutaways, cross-sections)
- [ ] Maintenance reminders/scheduling
- [ ] Photo annotation on maps

## Design Decisions Made (Build Phase 1)

### What I Chose
1. **Leaflet.js for maps** — Open source, lightweight, works offline with cached tiles
2. **Three.js for 3D** — WebGL standard, no plugins needed, works in all modern browsers
3. **localStorage for data** — 100% private, no cloud dependency, user controls backup
4. **Vanilla JS** — No framework overhead, easy to maintain, no build step
5. **Dark theme** — Professional look, easier on eyes for detailed work

### Why
- Privacy-first design (user is defense/intelligence professional)
- No external dependencies that could leak data
- Works offline after first load
- Extensible for future enhancements

## Known Limitations
1. House model is generic (needs real blueprints for accuracy)
2. No actual parcel boundary yet (needs GIS data)
3. No satellite imagery with parcel overlays
4. Blueprint viewer is basic (no measurement tools yet)

## Next Build Cycle Focus
- Integrate user-provided blueprints
- Add parcel boundary from York County GIS
- Improve 3D house model accuracy
