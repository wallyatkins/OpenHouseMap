/**
 * Open House Map — Versioned Data Layer (Wiki-style)
 *
 * Core model:
 *  - OSM data is fetched once and stored as "Revision 0" (the baseline)
 *  - Every subsequent edit creates a new version with full provenance
 *  - Changesets group related edits (like commits in Git)
 *  - Snapshots capture full state at points in time
 *  - Everything is 100% local — no cloud, no tracking
 *
 * Each feature carries:
 *  - Current state (live state)
 *  - Full version history (what changed, when, by whom, where from)
 *  - Source provenance (OSM ID if from OSM, user-annotated if added manually)
 *
 * This supports:
 *  - Viewing/editing/deleting features with full history
 *  - Reverting any feature to any previous version
 *  - Exporting all data (or just changesets) back to OSM format
 *  - Offline-first — OSM fetched once, works forever after
 */

const HOdata = {
    // ──────────────────────────────────────────────
    // Property metadata
    // ──────────────────────────────────────────────
    property: {
        address: "159 Stone Lake Court",
        city: "Yorktown, VA 23693",
        lat: 37.1705,
        lng: -76.5056,
        lotSize: "",
        yearBuilt: "",
        livingArea: "",
        stories: "",
        foundation: "",
        roofType: "",
        exterior: "",
        notes: ""
    },

    // ──────────────────────────────────────────────
    // Current feature set (live state)
    // ──────────────────────────────────────────────
    features: [],

    // ──────────────────────────────────────────────
    // Changesets (groups of related edits)
    // ──────────────────────────────────────────────
    changesets: [],

    // ──────────────────────────────────────────────
    // Snapshots (full-state captures at points in time)
    // ──────────────────────────────────────────────
    snapshots: [],

    // ──────────────────────────────────────────────
    // Maintenance log
    // ──────────────────────────────────────────────
    maintenance: [],

    // ──────────────────────────────────────────────
    // Blueprints
    // ──────────────────────────────────────────────
    blueprints: [],

    // ──────────────────────────────────────────────
    // OSM baseline tracking
    // ──────────────────────────────────────────────
    osmBaseline: {
        fetchedAt: null,          // ISO timestamp of OSM fetch
        boundingBox: null,        // {minLat, minLng, maxLat, maxLng}
        featureCount: 0,          // How many features were in the baseline
        changesetId: null,        // OSM changeset if we pushed back
        version: 0                // Always starts at 0
    },

    // ──────────────────────────────────────────────
    // Persistence
    // ──────────────────────────────────────────────
    STORAGE_KEY: 'ohm_v1',  // Single key with full state

    _computeState() {
        // Combine everything into one serializable object
        return {
            version: '2.0',
            property: this.property,
            features: this.features,
            changesets: this.changesets,
            snapshots: this.snapshots,
            maintenance: this.maintenance,
            blueprints: this.blueprints,
            osmBaseline: this.osmBaseline
        };
    },

    save() {
        try {
            const state = this._computeState();
            const json = JSON.stringify(state);
            // Warn if getting close to localStorage limit
            const bytes = new Blob([json]).size;
            if (bytes > 4.5 * 1024 * 1024) {
                console.warn(`[HOdata] Storage near limit: ${(bytes/1024/1024).toFixed(1)}MB`);
            }
            localStorage.setItem(this.STORAGE_KEY, json);
        } catch (e) {
            console.error('[HOdata] Save failed:', e.message);
        }
    },

    load() {
        try {
            const json = localStorage.getItem(this.STORAGE_KEY);
            if (!json) return; // Fresh install — no stored data

            const state = JSON.parse(json);
            if (state.version && state.version.startsWith('2.')) {
                // Full v2+ state
                if (state.property) this.property = { ...this.property, ...state.property };
                if (state.features) this.features = state.features;
                if (state.changesets) this.changesets = state.changesets;
                if (state.snapshots) this.snapshots = state.snapshots;
                if (state.maintenance) this.maintenance = state.maintenance;
                if (state.blueprints) this.blueprints = state.blueprints;
                if (state.osmBaseline) this.osmBaseline = { ...this.osmBaseline, ...state.osmBaseline };
            } else {
                // Legacy v1 state — migrate manually stored keys
                this._migrateV1();
            }
        } catch (e) {
            console.error('[HOdata] Load failed:', e.message);
        }
    },

    _migrateV1() {
        // Backward compat: old code used separate keys
        try {
            const prop = localStorage.getItem('ohm_property');
            if (prop) this.property = { ...this.property, ...JSON.parse(prop) };

            const feats = localStorage.getItem('ohm_features');
            if (feats) {
                const parsed = JSON.parse(feats);
                this.features = parsed.map(f => this._ensureFeatureVersioning(f));
            }

            const maint = localStorage.getItem('ohm_maintenance');
            if (maint) this.maintenance = JSON.parse(maint);

            const bps = localStorage.getItem('ohm_blueprints');
            if (bps) this.blueprints = JSON.parse(bps);

            this.save();

            // Clean up legacy keys
            localStorage.removeItem('ohm_property');
            localStorage.removeItem('ohm_features');
            localStorage.removeItem('ohm_maintenance');
            localStorage.removeItem('ohm_blueprints');
        } catch (e) {
            console.error('[HOdata] Migration failed:', e.message);
        }
    },

    _ensureFeatureVersioning(feature) {
        // If a feature lacks versioning info, add it
        if (!feature.versions) {
            feature.versions = [{
                version: 1,
                timestamp: feature.createdAt || new Date().toISOString(),
                changeset: 'migrated_v1',
                changeType: 'created',
                previous: null,
                current: { ...feature }
            }];
        }
        return feature;
    },

    // ──────────────────────────────────────────────
    // Feature CRUD with versioning
    // ──────────────────────────────────────────────

    /**
     * Add a new feature and record the creation in a changeset
     */
    addFeature(feature, changesetLabel = 'Manual addition') {
        const now = new Date().toISOString();
        const csId = this._createChangeset('add', feature.id, changesetLabel, 'user');
        const version = 1;

        const versionedFeature = {
            ...feature,
            id: feature.id || 'feat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            createdAt: now,
            updatedAt: now,
            versions: [{
                version: version,
                timestamp: now,
                changeset: csId,
                changeType: 'created',
                previous: null,
                current: { ...feature },
                provenance: {
                    source: 'user',
                    editor: 'owner'
                }
            }]
        };

        this.features.push(versionedFeature);
        this.save();
        return versionedFeature;
    },

    /**
     * Update a feature and record the change
     */
    updateFeature(id, updates, changesetLabel = 'Manual update') {
        const idx = this.features.findIndex(f => f.id === id);
        if (idx === -1) return null;

        const feature = this.features[idx];
        const now = new Date().toISOString();

        // Capture what changed
        const previous = { ...feature };
        delete previous.versions; // Don't include history in previous state

        Object.assign(feature, updates);
        feature.updatedAt = now;

        const csId = this._createChangeset('update', id, changesetLabel, 'user');
        const newVersion = (feature.versions ? feature.versions.length : 0) + 1;

        feature.versions.push({
            version: newVersion,
            timestamp: now,
            changeset: csId,
            changeType: 'updated',
            previous: previous,
            current: { ...feature },
            provenance: {
                source: 'user',
                editor: 'owner',
                diff: this._computeDiff(previous, updates)
            }
        });

        this.save();
        return feature;
    },

    /**
     * Delete a feature and record the deletion
     */
    deleteFeature(id, changesetLabel = 'Manual deletion') {
        const idx = this.features.findIndex(f => f.id === id);
        if (idx === -1) return null;

        const feature = this.features[idx];
        const now = new Date().toISOString();
        const csId = this._createChangeset('delete', id, changesetLabel, 'user');

        const deletedVersion = {
            version: (feature.versions ? feature.versions.length : 0) + 1,
            timestamp: now,
            changeset: csId,
            changeType: 'deleted',
            previous: { ...feature },
            current: null,
            provenance: {
                source: 'user',
                editor: 'owner'
            }
        };

        feature.versions.push(deletedVersion);
        this.features.splice(idx, 1);
        this.save();
        return deletedVersion;
    },

    /**
     * Get all versions of a feature (including deleted ones)
     */
    getFeatureHistory(featureId) {
        const feature = this.features.find(f => f.id === featureId);
        if (feature && feature.versions) return feature.versions;

        // Also check deleted features' version history
        // (we'd need a separate deleted features store for this,
        // but for now we only have live features)
        return [];
    },

    /**
     * Revert a feature to a specific version
     */
    revertFeature(featureId, targetVersion, changesetLabel = 'Version revert') {
        const feature = this.features.find(f => f.id === featureId);
        if (!feature || !feature.versions) return null;

        const target = feature.versions.find(v => v.version === targetVersion);
        if (!target) return null;

        const now = new Date().toISOString();
        const previous = { ...feature };
        delete previous.versions;

        // Restore to the target version's current state
        Object.assign(feature, target.current);
        feature.updatedAt = now;

        const csId = this._createChangeset('revert', featureId, changesetLabel, 'user');

        feature.versions.push({
            version: feature.versions.length + 1,
            timestamp: now,
            changeset: csId,
            changeType: 'reverted',
            previous: previous,
            current: { ...feature },
            provenance: {
                source: 'user',
                editor: 'owner',
                revertFromVersion: targetVersion
            }
        });

        this.save();
        return feature;
    },

    /**
     * Restore a deleted feature (only works if we tracked deleted features)
     */
    restoreFeature(featureData) {
        return this.addFeature(featureData, 'Restored from history');
    },

    // ──────────────────────────────────────────────
    // OSM Baseline Import
    // ──────────────────────────────────────────────

    /**
     * Import OSM data as the baseline (revision 0)
     * Called once during initial setup
     */
    importOSMBaseline(osmFeatures, changesetLabel = 'OSM baseline import') {
        const now = new Date().toISOString();
        const csId = this._createChangeset('import_osm', null, changesetLabel, 'osm');

        const imported = osmFeatures.map(osmFeature => {
            const version = 1;
            return {
                ...osmFeature,
                id: osmFeature.id || 'feat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                createdAt: now,
                updatedAt: now,
                versions: [{
                    version: version,
                    timestamp: now,
                    changeset: csId,
                    changeType: 'imported',
                    previous: null,
                    current: { ...osmFeature },
                    provenance: {
                        source: 'osm',
                        osmId: osmFeature.osmId || null,
                        osmType: osmFeature.osmType || null,
                        osmTags: osmFeature.osmTags || null,
                        importedFrom: 'overpass-api.de'
                    }
                }]
            };
        });

        this.features = imported;

        // Record baseline metadata
        this.osmBaseline = {
            fetchedAt: now,
            boundingBox: this._computeBBox(osmFeatures),
            featureCount: imported.length,
            changesetId: null,
            version: 0
        };

        // Take initial snapshot
        this.takeSnapshot('Initial OSM baseline snapshot');

        this.save();
        return imported;
    },

    // ──────────────────────────────────────────────
    // Changesets
    // ──────────────────────────────────────────────

    _createChangeset(changeType, featureId, label, source) {
        const now = new Date().toISOString();
        const id = 'cs_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

        const changeset = {
            id: id,
            timestamp: now,
            label: label,
            changeType: changeType, // 'add', 'update', 'delete', 'import_osm', 'revert'
            featureId: featureId,
            source: source, // 'user' or 'osm'
            diff: null
        };

        this.changesets.unshift(changeset); // Newest first
        return id;
    },

    // ──────────────────────────────────────────────
    // Snapshots
    // ──────────────────────────────────────────────

    takeSnapshot(label = 'Snapshot') {
        const now = new Date().toISOString();
        const id = 'snap_' + Date.now();

        // Deep copy features but strip circular version references
        const cleanCopy = this.features.map(f => {
            const clean = { ...f };
            clean.versions = f.versions ? f.versions.map(v => ({
                ...v,
                previous: v.previous ? { ...v.previous } : null,
                current: v.current ? { ...v.current } : null
            })) : [];
            return clean;
        });

        const snapshot = {
            id: id,
            timestamp: now,
            label: label,
            featureCount: this.features.length,
            data: cleanCopy
        };

        this.snapshots.unshift(snapshot); // Newest first
        return snapshot;
    },

    getSnapshot(snapshotId) {
        return this.snapshots.find(s => s.id === snapshotId);
    },

    /**
     * Restore entire state from a snapshot
     */
    restoreSnapshot(snapshotId, changesetLabel = 'Snapshot restore') {
        const snapshot = this.getSnapshot(snapshotId);
        if (!snapshot) return null;

        const now = new Date().toISOString();
        const csId = this._createChangeset('restore', null, changesetLabel, 'user');

        const previousState = JSON.parse(JSON.stringify(this.features));

        this.features = snapshot.data;

        // Add restore record to each feature's version history
        this.features.forEach(f => {
            f.updatedAt = now;
            if (!f.versions) f.versions = [];
            f.versions.push({
                version: f.versions.length + 1,
                timestamp: now,
                changeset: csId,
                changeType: 'restored_from_snapshot',
                previous: null,
                current: { ...f },
                provenance: {
                    source: 'user',
                    editor: 'owner',
                    snapshotId: snapshotId,
                    snapshotLabel: snapshot.label
                }
            });
        });

        this.save();
        return snapshot;
    },

    deleteSnapshot(snapshotId) {
        this.snapshots = this.snapshots.filter(s => s.id !== snapshotId);
        this.save();
    },

    // ──────────────────────────────────────────────
    // Maintenance log
    // ──────────────────────────────────────────────

    addMaintenance(entry) {
        entry.id = 'maint_' + Date.now();
        entry.createdAt = new Date().toISOString();
        this.maintenance.push(entry);
        this.save();
        return entry;
    },

    updateMaintenance(id, updates) {
        const idx = this.maintenance.findIndex(m => m.id === id);
        if (idx !== -1) {
            this.maintenance[idx] = { ...this.maintenance[idx], ...updates };
            this.save();
            return this.maintenance[idx];
        }
        return null;
    },

    deleteMaintenance(id) {
        this.maintenance = this.maintenance.filter(m => m.id !== id);
        this.save();
    },

    // ──────────────────────────────────────────────
    // Blueprints
    // ──────────────────────────────────────────────

    addBlueprint(entry) {
        entry.id = 'bp_' + Date.now();
        entry.createdAt = new Date().toISOString();
        this.blueprints.push(entry);
        this.save();
        return entry;
    },

    deleteBlueprint(id) {
        this.blueprints = this.blueprints.filter(b => b.id !== id);
        this.save();
    },

    // ──────────────────────────────────────────────
    // Export / Contribute
    // ──────────────────────────────────────────────

    /**
     * Export full data as JSON (backup, migration, audit)
     */
    exportData() {
        return JSON.stringify(this._computeState(), null, 2);
    },

    /**
     * Export only user edits as an Overpass query (for contributing to OSM)
     */
    exportAsOverpassQuery() {
        // Find user-edited features and build Overpass QL
        const userFeatures = this.features.filter(f => {
            const lastVersion = f.versions ? f.versions[f.versions.length - 1] : null;
            return lastVersion && lastVersion.provenance && lastVersion.provenance.source === 'user';
        });

        let query = '[out:json][timeout:25];\n\n';

        userFeatures.forEach(f => {
            const lastVersion = f.versions[f.versions.length - 1];
            if (lastVersion.changeType === 'deleted') return; // Don't export deletions

            const tagMap = this._featureToOSMTags(f);
            const tagsStr = Object.entries(tagMap)
                .map(([k, v]) => `"${k}"="${v}"`)
                .join(', ');

            if (tagsStr) {
                query += `nwr(37.16, -76.51, 37.18, -76.50)["${Object.keys(tagMap)[0]}"];\n`;
            }
        });

        query += 'out center;\n';
        return query;
    },

    _featureToOSMTags(feature) {
        const tags = {};

        // Map our categories to OSM tags
        if (feature.category === 'house' || feature.category === 'garage') {
            tags.building = feature.category === 'house' ? 'residential' : 'garage';
        } else if (feature.category === 'shed') {
            tags.building = 'shed';
        } else if (feature.category === 'driveway') {
            tags.highway = 'service';
            tags.service = 'driveway';
        } else if (feature.category === 'tree') {
            tags['natural'] = 'tree';
        } else if (feature.category === 'fence') {
            tags.barrier = 'fence';
        } else if (feature.category === 'water') {
            tags['natural'] = 'water';
        } else if (feature.category === 'garden') {
            tags.leisure = 'garden';
        } else if (feature.category === 'patio') {
            tags.area = 'yes';
            tags.landuse = 'grass';
        }

        // Add custom notes
        if (feature.notes) {
            tags.description = feature.notes;
        }

        return tags;
    },

    // ──────────────────────────────────────────────
    // Utility functions
    // ──────────────────────────────────────────────

    _computeDiff(previous, updates) {
        // Simple diff: list of changed keys
        const diff = {};
        for (const key in updates) {
            if (previous[key] !== updates[key]) {
                diff[key] = { from: previous[key], to: updates[key] };
            }
        }
        return Object.keys(diff).length > 0 ? diff : null;
    },

    _computeBBox(features) {
        if (!features || features.length === 0) return null;
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        features.forEach(f => {
            if (f.lat && f.lng) {
                minLat = Math.min(minLat, f.lat);
                maxLat = Math.max(maxLat, f.lat);
                minLng = Math.min(minLng, f.lng);
                maxLng = Math.max(maxLng, f.lng);
            }
        });
        return { minLat, minLng, maxLat, maxLng };
    }
};

// Initialize data store
HOdata.load();
console.log('[HOdata] Initialized', {
    features: HOdata.features.length,
    changesets: HOdata.changesets.length,
    snapshots: HOdata.snapshots.length,
    osmBaseline: HOdata.osmBaseline.fetchedAt ? '✓' : '✗'
});
