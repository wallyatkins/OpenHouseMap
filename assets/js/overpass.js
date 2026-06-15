/**
 * Overpass API Integration
 * Fetches OpenStreetMap data for a bounding box around the property
 * Uses the Overpass API (OSM's data query service)
 */

const OverpassAPI = {
    // Query OSM data for a bounding box
    // Returns all features within ~200m of the property
    async queryPropertyData(lat, lng) {
        // Create a bounding box around the property (~400m x 400m)
        const buffer = 0.0036; // ~400m at this latitude
        const bbox = {
            minLat: lat - buffer,
            minLng: lng - buffer,
            maxLat: lat + buffer,
            maxLng: lng + buffer
        };

        // Overpass QL query — minimal, working syntax
        // Overpass bbox format is: minLat,minLng,maxLat,maxLng
        const query = `[out:json][timeout:10];
way["building"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
node["natural"="tree"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
way["highway"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
out center;`;

        const endpoints = [
            'https://overpass.kumi.systems/api/interpreter',
            'https://overpass.openstreetmap.ru/cgi/interpreter',
            'https://overpass-api.de/api/interpreter'
        ];

        let lastError = null;
        for (const ep of endpoints) {
            try {
                const url = `${ep}?data=${encodeURIComponent(query)}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'OpenHouseMap/1.0'
                    },
                    signal: AbortSignal.timeout(15000)
                });

                if (!response.ok) {
                    throw new Error(`Overpass API error: ${response.status}`);
                }

                const data = await response.json();
                return this.processOverpassData(data, lat, lng);
            } catch (e) {
                lastError = e;
                console.warn(`[OverpassAPI] Failed ${ep}: ${e.message}`);
            }
        }

        return { elements: [], error: lastError ? lastError.message : 'All Overpass endpoints failed' };
    },

    // Convert OSM elements to our feature format
    processOverpassData(data, centerLat, centerLng) {
        const features = [];
        const nodes = {};

        // Build node lookup
        (data.elements || []).forEach(el => {
            if (el.type === 'node') {
                nodes[el.id] = { lat: el.lat, lng: el.lon, tags: el.tags || {} };
            }
        });

        // Process ways (polygons, lines)
        (data.elements || []).forEach(el => {
            if (el.type === 'way') {
                const nodesList = el.nodes || [];
                const tags = el.tags || {};

                // Create feature from OSM data
                const feature = this.osmWayToFeature(el, nodesList, tags, nodes, centerLat, centerLng);
                if (feature) {
                    features.push(feature);
                }
            }
        });

        return { elements: features, source: 'osm' };
    },

    // Convert OSM way to our feature format
    osmWayToFeature(osmElement, nodeIds, tags, nodes, centerLat, centerLng) {
        const category = this.getCategoryFromTags(tags);
        if (!category) return null;

        // Calculate approximate centroid
        let lat = centerLat;
        let lng = centerLng;

        if (nodeIds && nodeIds.length > 0) {
            let sumLat = 0;
            let sumLng = 0;
            nodeIds.forEach(nodeId => {
                const node = nodes[nodeId];
                if (node) {
                    sumLat += node.lat;
                    sumLng += node.lng;
                }
            });
            if (nodeIds.length > 0) {
                lat = sumLat / nodeIds.length;
                lng = sumLng / nodeIds.length;
            }
        }

        return {
            id: 'osm_' + osmElement.id,
            name: tags.name || this.getNameFromTags(tags, category),
            category: category,
            lat: lat,
            lng: lng,
            osmId: osmElement.id,
            osmTags: tags,
            material: tags.material || tags.building || '',
            year: tags.year || '',
            notes: this.formatNotes(tags, category),
            source: 'osm',
            verified: false // User needs to verify OSM data
        };
    },

    // Map OSM tags to our categories
    getCategoryFromTags(tags) {
        if (tags.building || tags['building:part']) return 'house';
        if (tags.highway === 'path' || tags.highway === 'footway' || tags.highway === 'footpath') return 'walkway';
        if (tags.highway === 'driveway') return 'driveway';
        if (tags.highway === 'living_street') return 'driveway';
        if (tags.waterway) return 'stormwater';
        if (tags.natural === 'water') return 'water';
        if (tags.natural === 'tree') return 'tree';
        if (tags.natural === 'wood') return 'tree';
        if (tags.landuse === 'garden') return 'garden';
        if (tags.landuse === 'residential') return 'lawn';
        if (tags.barrier === 'fence') return 'fence';
        if (tags.barrier === 'wall') return 'fence';
        if (tags.amenity === 'parking') return 'driveway';
        if (tags.amenity === 'bicycle_parking') return 'other';
        if (tags.leisure === 'garden') return 'garden';
        if (tags.leisure === 'park') return 'lawn';

        return null;
    },

    // Get a display name from OSM tags
    getNameFromTags(tags, category) {
        if (tags.name) return tags.name;
        if (tags.building) return `${tags.building.charAt(0).toUpperCase() + tags.building.slice(1)} Building`;
        if (tags.highway) return `${tags.highway.charAt(0).toUpperCase() + tags.highway.slice(1)} Road`;
        return `${category.charAt(0).toUpperCase() + category.slice(1)} Feature`;
    },

    // Format OSM tags into readable notes
    formatNotes(tags, category) {
        const notes = [];
        if (tags.material) notes.push(`Material: ${tags.material}`);
        if (tags.year_built) notes.push(`Year Built: ${tags.year_built}`);
        if (tags.building) notes.push(`Building Type: ${tags.building}`);
        if (tags.height) notes.push(`Height: ${tags.height}`);
        if (tags.levels) notes.push(`Levels: ${tags.levels}`);
        if (tags.surface) notes.push(`Surface: ${tags.surface}`);

        return notes.length > 0 ? notes.join(', ') : 'Source: OpenStreetMap';
    }
};
