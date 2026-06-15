# BMAD — Open House Map Methodology

## Overview

BMAD (Build, Measure, Analyze, Deploy) is the methodology we'll use to develop the Open House Map project. Each phase produces concrete artifacts and requires user review before moving to the next phase.

## BMAD Cycle Structure

### Phase 1: BUILD
**Goal:** Get working code on paper (or disk)
- Define the problem clearly
- Design the solution architecture
- Write the code
- Produce working software

### Phase 2: MEASURE
**Goal:** Evaluate what was built against real requirements
- Run tests
- Collect metrics
- Gather user feedback
- Document results

### Phase 3: ANALYZE
**Goal:** Make data-driven decisions about next steps
- Identify gaps between requirements and reality
- Prioritize improvements
- Update design based on findings
- Make tradeoff decisions

### Phase 4: DEPLOY
**Goal:** Release the improved version
- Apply fixes from analysis
- Ship the update
- Monitor for issues
- Collect new measurements

## Our BMAD Cycle for Open House Map

### Cycle 1: Foundation (Current)
- **Build:** Map + basic features + 3D house model + blueprint viewer
- **Measure:** User testing with actual property data and blueprints
- **Analyze:** What works, what doesn't, what's missing
- **Deploy:** Local-first, JSON export, ready for Cycle 2

### Cycle 2: Blueprint Integration (Next)
- **Build:** Integrate user's blueprints with 3D model
- **Measure:** Test with actual house dimensions
- **Analyze:** Accuracy, usability, detail level
- **Deploy:** Production-ready blueprint workflow

### Cycle 3: Parcel & GIS (Future)
- **Build:** Add actual parcel boundaries from county GIS
- **Measure:** Accuracy against survey data
- **Analyze:** Gaps between GIS and reality
- **Deploy:** Final property map

## Documentation Standards

Every cycle produces:
- [ ] Working code
- [ ] Updated architecture docs
- [ ] BMAD phase notes
- [ ] User-facing documentation

## Decision Framework

When making decisions:
1. **Privacy first** — user owns all data
2. **Open standards** — no vendor lock-in
3. **Extensible** — easy to add features later
4. **Documented** — explain why, not just what
