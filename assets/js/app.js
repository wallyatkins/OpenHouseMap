/**
 * Open House Map — Main Application
 * Navigation, Map, 3D House, Blueprints, Maintenance, Modals
 * 159 Stone Lake Court, Yorktown, VA 23693
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // Navigation
    // ============================================================
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.dataset.view;

            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding view
            views.forEach(v => v.classList.remove('view-active'));
            const targetView = document.getElementById('view-' + viewId);
            if (targetView) targetView.classList.add('view-active');

            // Initialize view-specific components
            if (viewId === 'map-surface' && !window._mapInitialized) {
                initMap();
            }
            if (viewId === 'house-3d' && !window._house3dInitialized) {
                initHouse3D();
            }
            if (viewId === 'house-detail') {
                initHouseDetail('foundation');
            }
            if (viewId === 'blueprints' && !window._bpInitialized) {
                initBlueprints();
            }
            if (viewId === 'maintenance' && !window._maintInitialized) {
                initMaintenance();
            }
        });
    });

    // ============================================================
    // Layer Toggle Buttons
    // ============================================================
    document.querySelectorAll('.toggle-btn[data-layer]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const layer = btn.dataset.layer;
            // In a full implementation, this would toggle map layers
            // For now, visual feedback only
            console.log('Toggled layer:', layer, btn.classList.contains('active'));
        });
    });

    // X-Ray mode buttons
    document.querySelectorAll('.toggle-btn[data-xray]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn[data-xray]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.xray;
            if (window._house3d && window._house3d.setXrayMode) {
                window._house3d.setXrayMode(mode);
            }
        });
    });

    // House layer checkboxes
    document.querySelectorAll('.layer-check input[data-hlayer]').forEach(cb => {
        cb.addEventListener('change', () => {
            const layer = cb.dataset.hlayer;
            if (window._house3d && window._house3d.toggleLayer) {
                window._house3d.toggleLayer(layer, cb.checked);
            }
        });
    });

    // Detail tabs
    document.querySelectorAll('.detail-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            initHouseDetail(tab.dataset.tab);
        });
    });

    // ============================================================
    // Modals
    // ============================================================

    // Feature modal
    const modalFeature = document.getElementById('modal-feature');
    document.getElementById('tool-draw').addEventListener('click', () => {
        openModal(modalFeature);
    });
    document.getElementById('modal-close').addEventListener('click', () => closeModal(modalFeature));
    document.getElementById('modal-cancel').addEventListener('click', () => closeModal(modalFeature));

    // Property modal
    const modalProperty = document.getElementById('modal-property');
    document.getElementById('btn-edit-property').addEventListener('click', () => {
        loadPropertyForm();
        openModal(modalProperty);
    });
    document.getElementById('prop-close').addEventListener('click', () => closeModal(modalProperty));
    document.getElementById('prop-cancel').addEventListener('click', () => closeModal(modalProperty));
    document.getElementById('prop-save').addEventListener('click', () => {
        savePropertyForm();
        closeModal(modalProperty);
    });

    // Maintenance modal
    const modalMaintenance = document.getElementById('modal-maintenance');
    document.getElementById('btn-new-maintenance').addEventListener('click', () => {
        resetMaintenanceForm();
        openModal(modalMaintenance);
    });
    document.getElementById('maint-close').addEventListener('click', () => closeModal(modalMaintenance));
    document.getElementById('maint-cancel').addEventListener('click', () => closeModal(modalMaintenance));
    document.getElementById('maint-save').addEventListener('click', () => {
        saveMaintenanceEntry();
        closeModal(modalMaintenance);
    });

    // Blueprint buttons
    document.getElementById('bp-browse').addEventListener('click', () => {
        document.getElementById('bp-file').click();
    });
    document.getElementById('bp-upload').addEventListener('click', () => {
        document.getElementById('bp-file').click();
    });
    document.getElementById('bp-file').addEventListener('change', handleBlueprintUpload);

    // Export/Import
    document.getElementById('tool-export').addEventListener('click', exportData);
    document.getElementById('tool-import').addEventListener('click', () => {
        const input = document.getElementById('import-file');
        input.click();
    });
    document.getElementById('import-file').addEventListener('change', importData);

    // Settings button
    document.getElementById('btn-settings').addEventListener('click', () => {
        document.getElementById('btn-edit-property').click();
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('open');
            }
        });
    });

    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
            const panel = document.getElementById('panel-feature');
            if (panel) panel.classList.remove('open');
        }
    });

    // Close detail panel
    document.getElementById('panel-close').addEventListener('click', () => {
        document.getElementById('panel-feature').classList.remove('open');
    });

    // ============================================================
    // Initialize — init active view's components on page load
    // ============================================================
    updatePropertyDisplay();

    const activeView = document.querySelector('.view-active');
    if (activeView) {
        const viewId = activeView.id.replace('view-', '');
        if (viewId === 'map-surface' && !window._mapInitialized) initMap();
        if (viewId === 'house-3d' && !window._house3dInitialized) initHouse3D();
        if (viewId === 'house-detail') initHouseDetail('foundation');
        if (viewId === 'blueprints' && !window._bpInitialized) initBlueprints();
        if (viewId === 'maintenance' && !window._maintInitialized) initMaintenance();
    }

    console.log('Open House Map initialized');
});

// ============================================================
// Modal helpers
// ============================================================
function openModal(modal) {
    modal.classList.add('open');
}

function closeModal(modal) {
    modal.classList.remove('open');
}

// ============================================================
// Map functionality
// ============================================================
let map = null;
let mapLayers = {};
let currentTool = null;

function initMap() {
    const mapEl = document.getElementById('map-surface');
    if (!mapEl) return;

    // Get property coordinates from data store
    const lat = HOdata.property.lat || 37.1705;
    const lng = HOdata.property.lng || -76.5056;

    // Create map
    map = L.map('map-surface', {
        zoomControl: true,
        attributionControl: true
    }).setView([lat, lng], 17);

    // Add tile layers
    const baseLayers = {
        aerial: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri',
            maxZoom: 22
        }),
        street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap',
            maxZoom: 19
        })
    };

    baseLayers.aerial.addTo(map);
    mapLayers.base = baseLayers;

    // Create feature groups
    mapLayers.utilities = L.layerGroup();
    mapLayers.structures = L.layerGroup();
    mapLayers.landscape = L.layerGroup();
    mapLayers.all = L.layerGroup();
    mapLayers.osm = L.layerGroup();  // OSM data layer
    mapLayers.osmMarkers = [];       // Store OSM markers for reference

    // Draw all features
    renderFeaturesToMap();

    // Add map click handler for dropping pins
    map.on('click', (e) => {
        if (currentTool === 'pin' || currentTool === 'draw') {
            openFeatureModal(null, e.latlng);
        }
    });

    // Initialize tool buttons
    setupMapTools();

    window._mapInitialized = true;
}

function renderFeaturesToMap() {
    // Clear existing layers
    Object.values(mapLayers).forEach(layer => {
        if (layer instanceof L.LayerGroup) {
            layer.clearLayers();
        }
    });

    HOdata.features.forEach(feature => {
        const color = getCategoryColor(feature.category);
        const icon = getCategoryIcon(feature.category);

        // Create custom icon
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.4);">${icon}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([feature.lat, feature.lng], { icon: customIcon });

        // Create popup content with versioning info
        const provenance = feature.versions && feature.versions.length > 0 
            ? feature.versions[feature.versions.length - 1].provenance 
            : { source: 'unknown' };
        
        const versionBadge = feature.versions 
            ? `<span style="font-size:0.75em;color:#8b5cf6;background:rgba(139,92,246,0.15);padding:2px 6px;border-radius:4px;">v${feature.versions.length}</span>`
            : '';
        
        const sourceBadge = provenance.source === 'osm'
            ? `<span style="font-size:0.75em;color:#f59e0b;background:rgba(245,158,11,0.15);padding:2px 6px;border-radius:4px;"><i class="fa-solid fa-globe"></i> OSM</span>`
            : `<span style="font-size:0.75em;color:#3b82f6;background:rgba(59,130,246,0.15);padding:2px 6px;border-radius:4px;"><i class="fa-solid fa-user"></i> Owner</span>`;

        const popupContent = `
            <div style="min-width:220px;">
                <h4 style="margin:0 0 4px;color:#3b82f6;">${feature.name}</h4>
                <div style="display:flex;gap:6px;margin-bottom:6px;">
                    <span class="category-tag">${getCategoryLabel(feature.category)}</span>
                    ${versionBadge}
                    ${sourceBadge}
                </div>
                ${feature.material ? `<p style="margin:4px 0;font-size:13px;"><strong>Material:</strong> ${feature.material}</p>` : ''}
                ${feature.year ? `<p style="margin:4px 0;font-size:13px;"><strong>Year:</strong> ${feature.year}</p>` : ''}
                ${feature.notes ? `<p style="margin:4px 0 8px;font-size:13px;color:#94a3b8;">${feature.notes}</p>` : ''}
                ${provenance.osmId ? `<p style="font-size:0.75em;color:#64748b;margin:4px 0;">OSM ID: ${provenance.osmId}</p>` : ''}
                ${feature.createdAt ? `<p style="font-size:0.75em;color:#64748b;margin:4px 0;">Created: ${new Date(feature.createdAt).toLocaleDateString()}</p>` : ''}
                <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                    <button class="btn-sm feat-edit-btn" data-id="${feature.id}">Edit</button>
                    <button class="btn-sm feat-history-btn" data-id="${feature.id}" style="background:#8b5cf6;color:white;border-color:#8b5cf6;">History</button>
                    <button class="btn-sm feat-delete-btn" style="background:#ef4444;color:white;border-color:#ef4444;" data-id="${feature.id}">Delete</button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);

        // Add click handler for edit/delete buttons
        marker.on('popupopen', () => {
            const popup = marker.getPopup();
            if (popup) {
                const el = popup.getElement();
                if (el) {
                    el.querySelectorAll('.feat-edit-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const id = btn.dataset.id;
                            openFeatureModal(HOdata.features.find(f => f.id === id));
                        });
                    });
                    el.querySelectorAll('.feat-history-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const id = btn.dataset.id;
                            openHistoryPanel(id);
                        });
                    });
                    el.querySelectorAll('.feat-delete-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (confirm('Delete this feature?')) {
                                HOdata.deleteFeature(btn.dataset.id);
                                map.closePopup();
                                renderFeaturesToMap();
                            }
                        });
                    });
                }
            }
        });

        // Categorize layers
        if (['electricity', 'gas', 'water', 'sewer', 'internet', 'sprinkler', 'stormwater'].includes(feature.category)) {
            mapLayers.utilities.addLayer(marker);
        } else if (['house', 'porch', 'deck', 'shed', 'garage', 'patio', 'driveway', 'walkway', 'concrete', 'footbridge'].includes(feature.category)) {
            mapLayers.structures.addLayer(marker);
        } else if (['tree', 'shrubs', 'garden', 'lawn', 'mulch', 'fence'].includes(feature.category)) {
            mapLayers.landscape.addLayer(marker);
        }

        mapLayers.all.addLayer(marker);
    });

    // Add layers to map
    mapLayers.all.addTo(map);
}

function getCategoryColor(category) {
    const colors = {
        house: '#3b82f6',
        porch: '#8b5cf6',
        deck: '#a855f7',
        shed: '#6b7280',
        garage: '#64748b',
        patio: '#f97316',
        driveway: '#6b7280',
        walkway: '#9ca3af',
        concrete: '#d1d5db',
        footbridge: '#78350f',
        electricity: '#facc15',
        gas: '#ef4444',
        water: '#06b6d4',
        sewer: '#475569',
        internet: '#6366f1',
        sprinkler: '#10b981',
        stormwater: '#0ea5e9',
        tree: '#22c55e',
        shrubs: '#84cc16',
        garden: '#a3e635',
        lawn: '#4ade80',
        mulch: '#92400e',
        fence: '#78716c',
        mailbox: '#f472b6',
        lighting: '#fbbf24',
        drainage: '#38bdf8',
        other: '#94a3b8'
    };
    return colors[category] || '#94a3b8';
}

function getCategoryIcon(category) {
    const icons = {
        house: '🏠',
        porch: '🏡',
        deck: '🪵',
        shed: '🏚️',
        garage: '🚗',
        patio: '🧱',
        driveway: '🛤️',
        walkway: '🚶',
        concrete: '⬜',
        footbridge: '🌉',
        electricity: '⚡',
        gas: '🔥',
        water: '💧',
        sewer: '🕳️',
        internet: '📡',
        sprinkler: '💦',
        stormwater: '🌊',
        tree: '🌳',
        shrubs: '🌿',
        garden: '🌺',
        lawn: '🌱',
        mulch: '🍂',
        fence: '🏗️',
        mailbox: '📮',
        lighting: '💡',
        drainage: '🔧',
        other: '📍'
    };
    return icons[category] || '📍';
}

function getCategoryLabel(category) {
    const labels = {
        house: 'Main House',
        porch: 'Porch',
        deck: 'Deck',
        shed: 'Shed',
        garage: 'Garage',
        patio: 'Patio',
        driveway: 'Driveway',
        walkway: 'Walkway',
        concrete: 'Concrete Pad',
        footbridge: 'Footbridge',
        electricity: 'Electricity Line',
        gas: 'Gas Line',
        water: 'Water Line',
        sewer: 'Sewer/Septic',
        internet: 'Internet/Phone',
        sprinkler: 'Sprinkler System',
        stormwater: 'Stormwater Drainage',
        tree: 'Tree',
        shrubs: 'Shrubs',
        garden: 'Garden',
        lawn: 'Lawn/Grass',
        mulch: 'Mulch/Ground Cover',
        fence: 'Fence',
        mailbox: 'Mailbox',
        lighting: 'Outdoor Lighting',
        drainage: 'Drainage',
        other: 'Other'
    };
    return labels[category] || category;
}

function openFeatureModal(feature = null, latlng = null) {
    const modal = document.getElementById('modal-feature');
    const title = document.getElementById('modal-title');

    if (feature) {
        // Editing existing feature
        title.textContent = 'Edit Feature';
        document.getElementById('feat-name').value = feature.name || '';
        document.getElementById('feat-category').value = feature.category || 'other';
        document.getElementById('feat-material').value = feature.material || '';
        document.getElementById('feat-year').value = feature.year || '';
        document.getElementById('feat-notes').value = feature.notes || '';

        document.getElementById('modal-save').onclick = () => {
            const updates = {
                name: document.getElementById('feat-name').value,
                category: document.getElementById('feat-category').value,
                material: document.getElementById('feat-material').value,
                year: document.getElementById('feat-year').value,
                notes: document.getElementById('feat-notes').value
            };

            if (!updates.name) {
                alert('Name is required');
                return;
            }

            HOdata.updateFeature(feature.id, updates);
            renderFeaturesToMap();
            closeModal(modal);
        };
    } else {
        // Adding new feature
        title.textContent = 'Add Feature';
        document.getElementById('feat-name').value = '';
        document.getElementById('feat-category').value = 'other';
        document.getElementById('feat-material').value = '';
        document.getElementById('feat-year').value = '';
        document.getElementById('feat-notes').value = '';

        document.getElementById('modal-save').onclick = () => {
            const newFeature = {
                id: 'feat_' + Date.now(),
                name: document.getElementById('feat-name').value,
                category: document.getElementById('feat-category').value,
                lat: latlng ? latlng.lat : (HOdata.property.lat || 37.1705),
                lng: latlng ? latlng.lng : (HOdata.property.lng || -76.5056),
                material: document.getElementById('feat-material').value,
                year: document.getElementById('feat-year').value,
                notes: document.getElementById('feat-notes').value
            };

            if (!newFeature.name) {
                alert('Name is required');
                return;
            }

            HOdata.addFeature(newFeature);
            renderFeaturesToMap();
            closeModal(modal);
        };
    }

    openModal(modal);
}

function setupMapTools() {
    const btnDraw = document.getElementById('tool-draw');
    const btnPin = document.getElementById('tool-pin');
    const btnMeasure = document.getElementById('tool-measure');

    if (btnDraw) {
        btnDraw.addEventListener('click', () => {
            currentTool = currentTool === 'draw' ? null : 'draw';
            btnDraw.style.borderColor = currentTool === 'draw' ? 'var(--accent)' : '';
            btnDraw.style.color = currentTool === 'draw' ? 'var(--accent)' : '';
        });
    }

    if (btnPin) {
        btnPin.addEventListener('click', () => {
            currentTool = currentTool === 'pin' ? null : 'pin';
            btnPin.style.borderColor = currentTool === 'pin' ? 'var(--accent)' : '';
            btnPin.style.color = currentTool === 'pin' ? 'var(--accent)' : '';
        });
    }

    if (btnMeasure) {
        btnMeasure.addEventListener('click', () => {
            currentTool = currentTool === 'measure' ? null : 'measure';
            btnMeasure.style.borderColor = currentTool === 'measure' ? 'var(--accent)' : '';
            btnMeasure.style.color = currentTool === 'measure' ? 'var(--accent)' : '';
        });
    }

    // OSM baseline fetch button
    const btnOSM = document.getElementById('tool-osm-baseline');
    if (btnOSM) {
        btnOSM.addEventListener('click', async () => {
            if (btnOSM.dataset.fetching === 'true') return;
            btnOSM.dataset.fetching = 'true';
            btnOSM.style.color = 'var(--warning)';
            btnOSM.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';

            const lat = HOdata.property.lat || 37.1705;
            const lng = HOdata.property.lng || -76.5056;

            try {
                // Check if we already have an OSM baseline
                if (HOdata.osmBaseline.fetchedAt) {
                    if (!confirm('You already have an OSM baseline fetched on ' + new Date(HOdata.osmBaseline.fetchedAt).toLocaleString() + '.\n\nThis will replace your current feature set with a fresh OSM snapshot. Continue?')) {
                        return;
                    }
                }

                const result = await OverpassAPI.queryPropertyData(lat, lng);
                
                if (!result.elements || result.elements.length === 0) {
                    alert('No OSM data found in this area. This could mean:\n- The area is not well-mapped by OSM\n- The Overpass API is temporarily unavailable\n- Your coordinates may need adjustment');
                    return;
                }

                // Import as versioned baseline (revision 0)
                const imported = HOdata.importOSMBaseline(result.elements, 'OSM baseline import');
                
                if (imported && imported.length > 0) {
                    renderFeaturesToMap();
                    updatePropertyDisplay();
                    alert(`✓ OSM baseline loaded!\n\nImported ${imported.length} features as Revision 0.\nEvery edit you make will create a new version.\n\nYou can now:\n• Edit, add, or delete features\n• View full history on any feature\n• Revert to any previous state\n• Take snapshots of the full state`);
                }
            } catch (error) {
                alert('Failed to fetch OSM data: ' + error.message);
            } finally {
                btnOSM.dataset.fetching = 'false';
                btnOSM.style.color = '';
                btnOSM.innerHTML = '<i class="fa-solid fa-satellite-dish"></i><span class="tool-label">OSM Baseline</span>';
            }
        });
    }

    // History panel button
    const btnHistory = document.getElementById('tool-history');
    if (btnHistory) {
        btnHistory.addEventListener('click', () => {
            openGlobalHistoryPanel();
        });
    }

    // Snapshot button
    const btnSnapshot = document.getElementById('tool-snapshot');
    if (btnSnapshot) {
        btnSnapshot.addEventListener('click', () => {
            const label = prompt('Snapshot label (e.g., "After adding patio"):', 'Snapshot ' + new Date().toLocaleDateString());
            if (label) {
                const snap = HOdata.takeSnapshot(label);
                alert(`✓ Snapshot taken!\n\nLabel: ${label}\nFeatures captured: ${snap.featureCount}`);
                updatePropertyDisplay();
            }
        });
    }

    // Export button
    const btnExport = document.getElementById('tool-export');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const data = HOdata.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `open-house-map-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            alert('✓ Data exported! This is a complete backup including all version history.');
        });
    }

    // Import button
    const btnImport = document.getElementById('tool-import');
    const importFile = document.getElementById('import-file');
    if (btnImport && importFile) {
        btnImport.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = HOdata.importData(event.target.result);
                    if (result.success) {
                        renderFeaturesToMap();
                        updatePropertyDisplay();
                        alert('✓ Data imported successfully!');
                    } else {
                        alert('Import failed: ' + result.error);
                    }
                };
                reader.readAsText(file);
            }
            importFile.value = '';
        });
    }
}

// ============================================================
// Feature History Panel
// ============================================================
function openHistoryPanel(featureId) {
    const feature = HOdata.features.find(f => f.id === featureId);
    if (!feature) return;

    const versions = feature.versions || [];
    
    let historyHTML = `
        <div style="margin-bottom:16px;">
            <h4 style="margin:0 0 4px;color:#3b82f6;">${feature.name}</h4>
            <p style="margin:0;font-size:13px;color:#64748b;">${getCategoryLabel(feature.category)}</p>
            <p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">${versions.length} version(s) recorded</p>
        </div>
        <div style="max-height:400px;overflow-y:auto;">
    `;

    if (versions.length === 0) {
        historyHTML += '<p style="color:#64748b;text-align:center;padding:20px;">No version history recorded.</p>';
    } else {
        versions.forEach((v, index) => {
            const isDeleted = v.changeType === 'deleted';
            const bgColor = isDeleted ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)';
            const borderColor = isDeleted ? '#ef4444' : '#22c55e';
            const timestamp = new Date(v.timestamp).toLocaleString();
            
            historyHTML += `
                <div style="border-left:3px solid ${borderColor};padding:8px 12px;margin-bottom:8px;background:${bgColor};border-radius:0 4px 4px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="font-weight:bold;font-size:13px;color:${isDeleted ? '#ef4444' : '#22c55e'};">
                            ${v.changeType.toUpperCase()}
                        </span>
                        <span style="font-size:11px;color:#64748b;">${timestamp}</span>
                    </div>
                    <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">
                        v${v.version} · Changeset: ${v.changeset.substring(0, 12)}...
                    </div>
                    ${v.provenance ? `
                        <div style="font-size:11px;color:#f59e0b;margin-bottom:4px;">
                            ${v.provenance.source === 'osm' ? '🌐 OSM' : '👤 User'}
                            ${v.provenance.osmId ? ' · OSM ID: ' + v.provenance.osmId : ''}
                            ${v.provenance.diff ? ' · ' + Object.keys(v.provenance.diff).length + ' fields changed' : ''}
                            ${v.provenance.revertFromVersion ? ' (reverted from v' + v.provenance.revertFromVersion + ')' : ''}
                        </div>
                    ` : ''}
                    ${!isDeleted && v.current ? `
                        <div style="font-size:11px;color:#64748b;margin-top:4px;">
                            ${v.current.name || ''} · ${v.current.category || ''}
                            ${v.current.material ? ' · ' + v.current.material : ''}
                        </div>
                    ` : ''}
                    ${!isDeleted ? `
                        <div style="margin-top:8px;">
                            <button class="btn-sm" style="background:#8b5cf6;color:white;border-color:#8b5cf6;padding:2px 8px;font-size:11px;" onclick="revertFeature('${feature.id}', ${v.version})">Revert to this version</button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    historyHTML += '</div>';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal feature-history-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3 style="margin:0;">📜 Version History</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="modal-body">
                ${historyHTML}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function revertFeature(featureId, targetVersion) {
    if (!confirm('Revert to version ' + targetVersion + '? This will create a new version with the reverted state.')) {
        return;
    }

    const result = HOdata.revertFeature(featureId, targetVersion, 'Manual revert to v' + targetVersion);
    if (result) {
        renderFeaturesToMap();
        alert('✓ Feature reverted to version ' + targetVersion + '!');
        // Refresh the history panel
        openHistoryPanel(featureId);
    } else {
        alert('Failed to revert.');
    }
}

// ============================================================
// Global Changeset History Panel
// ============================================================
function openGlobalHistoryPanel() {
    const changesets = HOdata.changesets;
    const snapshots = HOdata.snapshots;
    
    let historyHTML = `
        <div style="margin-bottom:16px;">
            <h4 style="margin:0 0 4px;color:#3b82f6;">Changeset History</h4>
            <p style="margin:0;font-size:13px;color:#64748b;">${changesets.length} changesets · ${snapshots.length} snapshots</p>
        </div>
    `;

    if (changesets.length === 0) {
        historyHTML += '<p style="color:#64748b;text-align:center;padding:20px;">No changes recorded yet. Edit or add features to start tracking history.</p>';
    } else {
        historyHTML += '<div style="max-height:400px;overflow-y:auto;">';
        changesets.forEach(cs => {
            const timestamp = new Date(cs.timestamp).toLocaleString();
            const bgColor = cs.source === 'osm' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)';
            const borderColor = cs.source === 'osm' ? '#f59e0b' : '#3b82f6';
            const sourceBadge = cs.source === 'osm' 
                ? '<span style="font-size:11px;color:#f59e0b;">🌐 OSM</span>' 
                : '<span style="font-size:11px;color:#3b82f6;">👤 User</span>';
            
            historyHTML += `
                <div style="border-left:3px solid ${borderColor};padding:8px 12px;margin-bottom:8px;background:${bgColor};border-radius:0 4px 4px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="font-weight:bold;font-size:13px;color:${borderColor};">${cs.changeType}</span>
                        <span style="font-size:11px;color:#64748b;">${timestamp}</span>
                    </div>
                    <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">
                        ${sourceBadge} · Label: ${cs.label}
                    </div>
                    ${cs.featureId ? `<div style="font-size:11px;color:#64748b;">Feature: ${cs.featureId.substring(0, 20)}...</div>` : ''}
                    <div style="font-size:11px;color:#64748b;margin-top:2px;">ID: ${cs.id}</div>
                </div>
            `;
        });
        historyHTML += '</div>';
    }

    if (snapshots.length > 0) {
        historyHTML += '<div style="margin-top:16px;"><h4 style="margin:0 0 8px;color:#8b5cf6;">Snapshots</h4>';
        snapshots.forEach(snap => {
            const timestamp = new Date(snap.timestamp).toLocaleString();
            historyHTML += `
                <div style="border-left:3px solid #8b5cf6;padding:8px 12px;margin-bottom:8px;background:rgba(139,92,246,0.1);border-radius:0 4px 4px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="font-weight:bold;font-size:13px;color:#8b5cf6;">📸 ${snap.label}</span>
                        <span style="font-size:11px;color:#64748b;">${timestamp}</span>
                    </div>
                    <div style="font-size:12px;color:#94a3b8;">${snap.featureCount} features · ID: ${snap.id}</div>
                    <div style="margin-top:8px;">
                        <button class="btn-sm" style="background:#8b5cf6;color:white;border-color:#8b5cf6;padding:2px 8px;font-size:11px;" onclick="restoreSnapshot('${snap.id}')">Restore this snapshot</button>
                    </div>
                </div>
            `;
        });
        historyHTML += '</div>';
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal feature-history-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <div class="modal-header">
                <h3 style="margin:0;">📜 Full History</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="modal-body">
                ${historyHTML}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function restoreSnapshot(snapshotId) {
    const snap = HOdata.getSnapshot(snapshotId);
    if (!snap) return;

    if (!confirm('Restore from snapshot "' + snap.label + '"?\n\nThis will restore all features to their state at that point in time and create a new version entry.')) {
        return;
    }

    const result = HOdata.restoreSnapshot(snapshotId, 'Restored from snapshot: ' + snap.label);
    if (result) {
        renderFeaturesToMap();
        updatePropertyDisplay();
        alert('✓ State restored from snapshot!');
        openGlobalHistoryPanel();
    } else {
        alert('Failed to restore snapshot.');
    }
}

// ============================================================
// OSM Data Layer
// ============================================================
function renderOSMData(osmFeatures, centerLat, centerLng) {
    // Clear existing OSM layer
    mapLayers.osm.clearLayers();
    mapLayers.osmMarkers = [];

    osmFeatures.forEach(feature => {
        const color = getCategoryColor(feature.category);
        const icon = getCategoryIcon(feature.category);

        const customIcon = L.divIcon({
            className: 'custom-marker osm-marker',
            html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.4);border:2px solid rgba(255,255,255,0.3);opacity:0.8;">${icon}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker([feature.lat, feature.lng], { icon: customIcon, opacity: 0.8 });

        // Popup content showing OSM source
        const popupContent = `
            <div style="min-width:220px;">
                <h4 style="margin:0 0 4px;color:#3b82f6;">${feature.name}</h4>
                <div style="display:flex;gap:6px;margin-bottom:8px;">
                    <span class="category-tag">${getCategoryLabel(feature.category)}</span>
                    <span style="font-size:0.75em;color:#f59e0b;background:rgba(245,158,11,0.15);padding:2px 6px;border-radius:4px;">
                        <i class="fa-solid fa-globe"></i> OSM
                    </span>
                </div>
                ${feature.material ? `<p style="margin:4px 0;font-size:13px;"><strong>Material:</strong> ${feature.material}</p>` : ''}
                ${feature.notes ? `<p style="margin:4px 0 8px;font-size:13px;color:#94a3b8;">${feature.notes}</p>` : ''}
                <p style="font-size:0.75em;color:#f59e0b;margin:8px 0;"><i class="fa-solid fa-triangle-exclamation"></i> Community-contributed data — verify accuracy</p>
                <div style="margin-top:8px;display:flex;gap:6px;">
                    <button class="btn-sm feat-adopt-btn" data-id="${feature.id}" data-osm-id="${feature.osmId}">Adopt</button>
                    <button class="btn-sm feat-delete-btn" style="background:#ef4444;color:white;border-color:#ef4444;" data-id="${feature.id}">Remove</button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);

        // Handle adopt button (copy OSM data to user features)
        marker.on('popupopen', () => {
            const popup = marker.getPopup();
            if (popup) {
                const el = popup.getElement();
                if (el) {
                    el.querySelectorAll('.feat-adopt-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const osmId = btn.dataset.osmId;
                            const osmFeature = osmFeatures.find(f => f.osmId == osmId);
                            if (osmFeature) {
                                // Add as user feature (removes OSM source tag)
                                const userFeature = {
                                    ...osmFeature,
                                    id: 'feat_' + Date.now(),
                                    source: 'user',
                                    verified: true
                                };
                                HOdata.addFeature(userFeature);
                                // Remove from OSM layer
                                mapLayers.osm.removeLayer(marker);
                                mapLayers.osmMarkers = mapLayers.osmMarkers.filter(m => m !== marker);
                                // Refresh map
                                renderFeaturesToMap();
                                renderOSMData(osmFeatures, centerLat, centerLng);
                                alert(`Adopted "${osmFeature.name}" — now part of your verified property data.`);
                            }
                        });
                    });
                    el.querySelectorAll('.feat-delete-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            mapLayers.osm.removeLayer(marker);
                            mapLayers.osmMarkers = mapLayers.osmMarkers.filter(m => m !== marker);
                        });
                    });
                }
            }
        });

        // Add to OSM layer group
        mapLayers.osm.addLayer(marker);
        mapLayers.osmMarkers.push(marker);
    });

    // Add OSM layer to map
    if (!map.hasLayer(mapLayers.osm)) {
        mapLayers.osm.addTo(map);
    }
}

function getCategoryColor(category) {
    const colors = {
        house: '#3b82f6',
        porch: '#8b5cf6',
        deck: '#a855f7',
        shed: '#6b7280',
        garage: '#64748b',
        patio: '#f97316',
        driveway: '#6b7280',
        walkway: '#9ca3af',
        concrete: '#d1d5db',
        footbridge: '#78350f',
        electricity: '#facc15',
        gas: '#ef4444',
        water: '#06b6d4',
        sewer: '#475569',
        internet: '#6366f1',
        sprinkler: '#10b981',
        stormwater: '#0ea5e9',
        tree: '#22c55e',
        shrubs: '#84cc16',
        garden: '#a3e635',
        lawn: '#4ade80',
        mulch: '#92400e',
        fence: '#78716c',
        mailbox: '#f472b6',
        lighting: '#fbbf24',
        drainage: '#38bdf8',
        other: '#94a3b8'
    };
    return colors[category] || '#94a3b8';
}

// ============================================================
// 3D House Model (Three.js)
// ============================================================
let scene = null;
let camera = null;
let renderer = null;
let houseGroup = null;
let houseLayers = {};

function initHouse3D() {
    const container = document.getElementById('house-3d-view');
    if (!container) return;

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Create house group
    houseGroup = new THREE.Group();
    scene.add(houseGroup);

    // Create house components
    createHouseComponents();

    // Make draggable with mouse
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };

            const deltaRotationQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    0,
                    deltaMove.x * 0.01,
                    0,
                    'XYZ'
                ));

            houseGroup.quaternion.multiplyQuaternions(deltaRotationQuaternion, houseGroup.quaternion);
        }
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.position.z += e.deltaY * 0.01;
        camera.position.z = Math.max(5, Math.min(50, camera.position.z));
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    window._house3d = {
        scene,
        camera,
        renderer,
        houseGroup,
        houseLayers,
        setXrayMode(mode) {
            if (mode === 'none') {
                Object.values(houseLayers).forEach(layer => {
                    layer.forEach(mesh => {
                        mesh.visible = true;
                        mesh.material.transparent = false;
                        mesh.material.opacity = 1;
                    });
                });
            } else {
                // Hide all layers first
                Object.values(houseLayers).forEach(layers => {
                    layers.forEach(mesh => {
                        mesh.visible = false;
                    });
                });

                // Show relevant layer
                switch(mode) {
                    case 'structure':
                        ['slab', 'floor', 'walls', 'roof'].forEach(key => {
                            if (houseLayers[key]) houseLayers[key].forEach(m => m.visible = true);
                        });
                        break;
                    case 'electrical':
                        if (houseLayers.electrical) houseLayers.electrical.forEach(m => m.visible = true);
                        break;
                    case 'plumbing':
                        if (houseLayers.plumbing_h) houseLayers.plumbing_h.forEach(m => m.visible = true);
                        break;
                    case 'hvac':
                        if (houseLayers.hvac_h) houseLayers.hvac_h.forEach(m => m.visible = true);
                        break;
                    case 'insulation':
                        if (houseLayers.insulation_h) houseLayers.insulation_h.forEach(m => m.visible = true);
                        break;
                }
            }
        },
        toggleLayer(name, visible) {
            if (houseLayers[name]) {
                houseLayers[name].forEach(mesh => {
                    mesh.visible = visible;
                });
            }
        }
    };

    window._house3dInitialized = true;
}

function createHouseComponents() {
    // Clear existing
    while (houseGroup.children.length > 0) {
        houseGroup.remove(houseGroup.children[0]);
    }

    houseLayers = {};

    // Helper to create mesh
    function createMesh(geometry, color, name) {
        const material = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        return mesh;
    }

    // Foundation slab
    const slabGeo = new THREE.BoxGeometry(12, 0.5, 8);
    const slab = createMesh(slabGeo, 0x6b7280, 'Foundation Slab');
    slab.position.y = -0.25;
    houseGroup.add(slab);
    if (!houseLayers.slab) houseLayers.slab = [];
    houseLayers.slab.push(slab);

    // First floor
    const floorGeo = new THREE.BoxGeometry(12, 0.3, 8);
    const floor = createMesh(floorGeo, 0x92400e, 'First Floor');
    floor.position.y = 0.15;
    houseGroup.add(floor);
    if (!houseLayers.floor) houseLayers.floor = [];
    houseLayers.floor.push(floor);

    // Walls (simplified - 4 walls with some openings)
    const wallHeight = 3;
    const wallThickness = 0.3;

    // Front wall
    const frontWallGeo = new THREE.BoxGeometry(12, wallHeight, wallThickness);
    const frontWall = createMesh(frontWallGeo, 0xd97706, 'Front Wall');
    frontWall.position.set(0, 0.3 + wallHeight/2, 4);
    houseGroup.add(frontWall);
    if (!houseLayers.walls) houseLayers.walls = [];
    houseLayers.walls.push(frontWall);

    // Back wall
    const backWall = createMesh(frontWallGeo, 0xd97706, 'Back Wall');
    backWall.position.set(0, 0.3 + wallHeight/2, -4);
    houseGroup.add(backWall);
    houseLayers.walls.push(backWall);

    // Left wall
    const sideWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, 8);
    const leftWall = createMesh(sideWallGeo, 0xd97706, 'Left Wall');
    leftWall.position.set(-6, 0.3 + wallHeight/2, 0);
    houseGroup.add(leftWall);
    houseLayers.walls.push(leftWall);

    // Right wall
    const rightWall = createMesh(sideWallGeo, 0xd97706, 'Right Wall');
    rightWall.position.set(6, 0.3 + wallHeight/2, 0);
    houseGroup.add(rightWall);
    houseLayers.walls.push(rightWall);

    // Roof (simplified gable)
    const roofGeo = new THREE.ConeGeometry(9, 3, 4);
    const roof = createMesh(roofGeo, 0x374151, 'Roof');
    roof.position.y = 0.3 + wallHeight + 1.5;
    roof.rotation.y = Math.PI / 4;
    houseGroup.add(roof);
    if (!houseLayers.roof) houseLayers.roof = [];
    houseLayers.roof.push(roof);

    // Electrical wires (red lines)
    for (let i = 0; i < 5; i++) {
        const wireGeo = new THREE.CylinderGeometry(0.05, 0.05, 10, 8);
        const wire = createMesh(wireGeo, 0xef4444, 'Electrical Wire ' + i);
        wire.position.set(-5 + i * 2.5, 2, 0);
        wire.rotation.z = Math.PI / 2;
        houseGroup.add(wire);
        if (!houseLayers.electrical) houseLayers.electrical = [];
        houseLayers.electrical.push(wire);
    }

    // Plumbing pipes (blue lines)
    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 12, 8);
    const pipe = createMesh(pipeGeo, 0x3b82f6, 'Plumbing Pipe');
    pipe.position.set(0, 0.5, 0);
    pipe.rotation.z = Math.PI / 2;
    houseGroup.add(pipe);
    if (!houseLayers.plumbing_h) houseLayers.plumbing_h = [];
    houseLayers.plumbing_h.push(pipe);

    // HVAC ducts (white lines)
    const ductGeo = new THREE.BoxGeometry(8, 0.3, 0.5);
    const duct = createMesh(ductGeo, 0xf3f4f6, 'HVAC Duct');
    duct.position.set(0, 3.5, 0);
    houseGroup.add(duct);
    if (!houseLayers.hvac_h) houseLayers.hvac_h = [];
    houseLayers.hvac_h.push(duct);

    // Windows (cyan boxes)
    const windowGeo = new THREE.BoxGeometry(2, 1.5, 0.1);
    const window1 = createMesh(windowGeo, 0x06b6d4, 'Window 1');
    window1.position.set(-3, 2, 4.1);
    houseGroup.add(window1);
    if (!houseLayers.windows) houseLayers.windows = [];
    houseLayers.windows.push(window1);

    const window2 = createMesh(windowGeo, 0x06b6d4, 'Window 2');
    window2.position.set(3, 2, 4.1);
    houseGroup.add(window2);
    houseLayers.windows.push(window2);

    // Doors (brown boxes)
    const doorGeo = new THREE.BoxGeometry(1.2, 2.5, 0.1);
    const door = createMesh(doorGeo, 0x78350f, 'Front Door');
    door.position.set(0, 1.55, 4.1);
    houseGroup.add(door);
    if (!houseLayers.doors) houseLayers.doors = [];
    houseLayers.doors.push(door);

    // Add ground plane
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    houseGroup.add(ground);

    // Center camera on house
    if (camera) {
        camera.position.set(15, 10, 15);
        camera.lookAt(0, 2, 0);
    }
}

// ============================================================
// House Detail View
// ============================================================
function initHouseDetail(tab) {
    const content = document.getElementById('detail-content');
    if (!content) return;

    const componentList = document.getElementById('component-list');

    const detailData = {
        foundation: {
            title: 'Foundation & Slab',
            sections: [
                {
                    title: 'Foundation Type',
                    description: 'Slab on grade foundation. Concrete slab poured directly on prepared ground with gravel base and vapor barrier.',
                    specs: [
                        { label: 'Type', value: 'Slab on grade' },
                        { label: 'Thickness', value: '4-6 inches' },
                        { label: 'Material', value: 'Concrete, 3000-4000 PSI' },
                        { label: 'Vapor Barrier', value: '6mil polyethylene' },
                        { label: 'Gravel Base', value: '4-6 inches compacted' },
                        { label: 'Reinforcement', value: 'Welded wire mesh' }
                    ]
                }
            ]
        },
        structure: {
            title: 'Structure / Framing',
            sections: [
                {
                    title: 'Wall Framing',
                    description: 'Standard 2x6 wood framing with 16" on center stud spacing. Exterior walls insulated with fiberglass batts.',
                    specs: [
                        { label: 'Stud Size', value: '2x6' },
                        { label: 'Spacing', value: '16" OC' },
                        { label: 'Height', value: '92-3/4" (8ft walls)' },
                        { label: 'Top Plates', value: 'Double 2x6' },
                        { label: 'Bottom Plate', value: 'Pressure-treated 2x6' },
                        { label: 'Sheathing', value: 'OSB or plywood' }
                    ]
                },
                {
                    title: 'Floor Framing',
                    description: '2x10 joists at 16" OC spanning from exterior wall to interior beam or foundation.',
                    specs: [
                        { label: 'Joist Size', value: '2x10' },
                        { label: 'Spacing', value: '16" OC' },
                        { label: 'Span', value: 'Varies by floor' },
                        { label: 'Subfloor', value: '3/4" plywood or OSB' }
                    ]
                },
                {
                    title: 'Roof Framing',
                    description: 'Gable roof with 2x8 rafters at 24" OC. Ridge board at peak.',
                    specs: [
                        { label: 'Rafter Size', value: '2x8' },
                        { label: 'Spacing', value: '24" OC' },
                        { label: 'Ridge Board', value: '2x10' },
                        { label: 'Roof Pitch', value: '6/12 (typical)' }
                    ]
                }
            ]
        },
        'electrical-detail': {
            title: 'Electrical Systems',
            sections: [
                {
                    title: 'Main Panel',
                    description: '200A main service panel, typically located in garage or utility room.',
                    specs: [
                        { label: 'Service', value: '200A' },
                        { label: 'Voltage', value: '120/240V' },
                        { label: 'Panel Type', value: 'Breaker panel' },
                        { label: 'Manufacturer', value: '—' },
                        { label: 'Year Installed', value: '—' }
                    ]
                },
                {
                    title: 'Circuit Breakers',
                    description: 'Individual circuits for lighting, outlets, appliances, HVAC, water heater, etc.',
                    specs: [
                        { label: 'Lighting', value: '15A circuits' },
                        { label: 'Outlets', value: '20A circuits' },
                        { label: 'Kitchen', value: '20A (2x) dedicated' },
                        { label: 'HVAC', value: 'Dedicated circuit' },
                        { label: 'Water Heater', value: '30A dedicated' },
                        { label: 'Dryer', value: '30A dedicated' }
                    ]
                }
            ]
        },
        'plumbing-detail': {
            title: 'Plumbing Systems',
            sections: [
                {
                    title: 'Water Supply',
                    description: 'Pressurized water supply from municipal main. Copper or PEX piping throughout.',
                    specs: [
                        { label: 'Supply Type', value: 'Municipal' },
                        { label: 'Pressure', value: '40-80 PSI' },
                        { label: 'Pipe Material', value: 'Copper/PEX' },
                        { label: 'Main Shut-off', value: 'Near water meter' },
                        { label: 'Water Heater', value: '—' }
                    ]
                },
                {
                    title: 'Drain/Waste/Vent',
                    description: 'ABS or PVC drain pipes with proper venting to exterior.',
                    specs: [
                        { label: 'DWV Material', value: 'ABS/PVC' },
                        { label: 'Main Drain', value: '4" diameter' },
                        { label: 'Vent Stack', value: '3-4" diameter' },
                        { label: 'Cleanouts', value: '—' }
                    ]
                }
            ]
        },
        'hvac-detail': {
            title: 'HVAC Systems',
            sections: [
                {
                    title: 'Heating & Cooling',
                    description: 'Central HVAC system with air handler and condenser unit.',
                    specs: [
                        { label: 'Heating', value: 'Gas furnace' },
                        { label: 'Cooling', value: 'Central AC' },
                        { label: 'Capacity', value: '3-5 tons' },
                        { label: 'AFUE Rating', value: '—' },
                        { label: 'SEER Rating', value: '—' }
                    ]
                },
                {
                    title: 'Ductwork',
                    description: 'Sheet metal or flex ductwork throughout conditioned spaces.',
                    specs: [
                        { label: 'Supply Ducts', value: '6-10" round/rectangular' },
                        { label: 'Return Ducts', value: '8-14" round/rectangular' },
                        { label: 'Insulation', value: 'Duct wrap or foil-faced' },
                        { label: 'Air Filter', value: '16x25x1 (typical)' }
                    ]
                }
            ]
        },
        insulation: {
            title: 'Insulation',
            sections: [
                {
                    title: 'Wall Insulation',
                    description: 'Fiberglass batt insulation R-19 to R-21 in 2x6 walls.',
                    specs: [
                        { label: 'Type', value: 'Fiberglass batt' },
                        { label: 'R-Value', value: 'R-19 to R-21' },
                        { label: 'Batts', value: '3.5" thick' },
                        { label: 'Vapor Barrier', value: 'Faced batts or separate' }
                    ]
                },
                {
                    title: 'Attic/Ceiling Insulation',
                    description: 'Blown-in cellulose or fiberglass batts R-38 to R-49.',
                    specs: [
                        { label: 'Type', value: 'Blown cellulose/batts' },
                        { label: 'R-Value', value: 'R-38 to R-49' },
                        { label: 'Depth', value: '12-16 inches' },
                        { label: 'Vented', value: 'Yes (soffit/ridge vents)' }
                    ]
                },
                {
                    title: 'Foundation/Crawlspace',
                    description: 'Perimeter insulation on interior or exterior of foundation walls.',
                    specs: [
                        { label: 'Type', value: 'Rigid foam/batts' },
                        { label: 'R-Value', value: 'R-10 to R-13' },
                        { label: 'Location', value: 'Interior wall or exterior' }
                    ]
                }
            ]
        },
        finishes: {
            title: 'Interior & Exterior Finishes',
            sections: [
                {
                    title: 'Exterior',
                    description: 'Exterior cladding and trim details.',
                    specs: [
                        { label: 'Siding', value: 'Brick veneer' },
                        { label: 'Trim', value: 'Vinyl or wood' },
                        { label: 'Paint/Stain', value: '—' },
                        { label: 'Last Painted', value: '—' }
                    ]
                },
                {
                    title: 'Interior Walls',
                    description: 'Drywall on wood framing, taped and mudded.',
                    specs: [
                        { label: 'Material', value: 'Gypsum board (drywall)' },
                        { label: 'Thickness', value: '1/2" (walls), 5/8" (ceilings)' },
                        { label: 'Finish', value: 'Paint (flat/satin/eggshell)' },
                        { label: 'Ceiling Height', value: '8-10 ft' }
                    ]
                },
                {
                    title: 'Flooring',
                    description: 'Various flooring materials by room.',
                    specs: [
                        { label: 'Living Areas', value: 'Hardwood/laminate' },
                        { label: 'Kitchen', value: 'Tile/laminate' },
                        { label: 'Bathrooms', value: 'Tile/vinyl' },
                        { label: 'Bedrooms', value: 'Carpet/hardwood' },
                        { label: 'Basement', value: '—' }
                    ]
                }
            ]
        }
    };

    const data = detailData[tab] || detailData.foundation;

    // Build content
    let html = '';
    data.sections.forEach(section => {
        html += `<div class="detail-card">`;
        html += `<h3>${section.title}</h3>`;
        html += `<p>${section.description}</p>`;
        if (section.specs && section.specs.length) {
            html += `<div class="detail-specs">`;
            section.specs.forEach(spec => {
                html += `<div class="detail-spec">
                    <div class="spec-label">${spec.label}</div>
                    <div class="spec-value">${spec.value}</div>
                </div>`;
            });
            html += `</div>`;
        }
        html += `</div>`;
    });

    content.innerHTML = html;

    // Build component list
    const componentColors = {
        foundation: '#6b7280',
        walls: '#d97706',
        electrical: '#ef4444',
        plumbing: '#3b82f6',
        hvac: '#f3f4f6',
        insulation: '#fbbf24',
        windows: '#06b6d4',
        doors: '#78350f',
        roof: '#374151'
    };

    const components = [
        { name: 'Foundation Slab', color: '#6b7280' },
        { name: 'Floor Plan', color: '#92400e' },
        { name: 'Walls / Studs', color: '#d97706' },
        { name: 'Roof / Trusses', color: '#374151' },
        { name: 'Electrical', color: '#ef4444' },
        { name: 'Plumbing', color: '#3b82f6' },
        { name: 'HVAC', color: '#f3f4f6' },
        { name: 'Insulation', color: '#fbbf24' },
        { name: 'Windows', color: '#06b6d4' },
        { name: 'Doors', color: '#78350f' }
    ];

    let compHtml = '';
    components.forEach(comp => {
        compHtml += `<div class="component-item">
            <div class="component-dot" style="background:${comp.color};"></div>
            <span>${comp.name}</span>
        </div>`;
    });

    if (componentList) {
        componentList.innerHTML = compHtml;
    }
}

// ============================================================
// Blueprint Viewer
// ============================================================
let bpImages = [];
let bpCurrentIndex = -1;

function initBlueprints() {
    // Load saved blueprints from data store
    bpImages = HOdata.blueprints || [];
    bpCurrentIndex = -1;
    renderBlueprintThumbnails();

    if (bpImages.length > 0) {
        loadBlueprint(0);
    }

    window._bpInitialized = true;
}

function handleBlueprintUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const bp = {
                id: 'bp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                name: file.name,
                data: e.target.result,
                uploadedAt: new Date().toISOString()
            };

            bpImages.push(bp);
            HOdata.blueprints = bpImages;
            HOdata.save();

            renderBlueprintThumbnails();
            loadBlueprint(bpImages.length - 1);
        };
        reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
}

function renderBlueprintThumbnails() {
    const container = document.getElementById('bp-thumbnails');
    if (!container) return;

    if (bpImages.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    bpImages.forEach((bp, index) => {
        const isActive = index === bpCurrentIndex ? 'active' : '';
        html += `<div class="bp-thumb-item ${isActive}" data-index="${index}">
            <img src="${bp.data}" alt="${bp.name}">
            <div class="bp-name">${bp.name}</div>
            <button class="bp-delete" data-index="${index}">×</button>
        </div>`;
    });

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.bp-thumb-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('bp-delete')) {
                loadBlueprint(parseInt(item.dataset.index));
            }
        });
    });

    container.querySelectorAll('.bp-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            bpImages.splice(index, 1);
            HOdata.blueprints = bpImages;
            HOdata.save();
            renderBlueprintThumbnails();
            if (bpCurrentIndex === index) {
                bpCurrentIndex = -1;
                clearBlueprint();
            }
        });
    });
}

function loadBlueprint(index) {
    if (index < 0 || index >= bpImages.length) return;

    bpCurrentIndex = index;
    const bp = bpImages[index];

    const placeholder = document.getElementById('bp-placeholder');
    const canvas = document.getElementById('bp-canvas');

    if (placeholder) placeholder.style.display = 'none';
    if (canvas) canvas.style.display = 'block';

    // Draw image on canvas
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        const container = document.getElementById('blueprint-canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Scale image to fit
        const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
        );

        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, w, h);
    };
    img.src = bp.data;

    // Update thumbnails
    document.querySelectorAll('.bp-thumb-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.index) === index);
    });
}

function clearBlueprint() {
    const placeholder = document.getElementById('bp-placeholder');
    const canvas = document.getElementById('bp-canvas');

    if (placeholder) placeholder.style.display = '';
    if (canvas) canvas.style.display = 'none';

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ============================================================
// Maintenance Log
// ============================================================
function initMaintenance() {
    renderMaintenanceList();
    window._maintInitialized = true;
}

function resetMaintenanceForm() {
    document.getElementById('maint-title').value = '';
    document.getElementById('maint-category').value = 'other';
    document.getElementById('maint-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('maint-status').value = 'planned';
    document.getElementById('maint-cost').value = '';
    document.getElementById('maint-next-due').value = '';
    document.getElementById('maint-notes').value = '';
}

function saveMaintenanceEntry() {
    const entry = {
        title: document.getElementById('maint-title').value,
        category: document.getElementById('maint-category').value,
        date: document.getElementById('maint-date').value,
        status: document.getElementById('maint-status').value,
        cost: parseFloat(document.getElementById('maint-cost').value) || 0,
        nextDue: document.getElementById('maint-next-due').value,
        notes: document.getElementById('maint-notes').value
    };

    if (!entry.title) {
        alert('Title is required');
        return;
    }

    HOdata.addMaintenance(entry);
    renderMaintenanceList();
}

function renderMaintenanceList(filter = '') {
    const container = document.getElementById('maintenance-list');
    if (!container) return;

    let entries = HOdata.maintenance;

    // Apply filter
    if (filter) {
        const search = filter.toLowerCase();
        entries = entries.filter(e =>
            e.title.toLowerCase().includes(search) ||
            (e.notes && e.notes.toLowerCase().includes(search)) ||
            e.category.toLowerCase().includes(search)
        );
    }

    // Sort by date (newest first)
    entries.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-list"></i>
                <p>${filter ? 'No entries match your search.' : 'No maintenance entries yet. Click "New Entry" to add one.'}</p>
            </div>
        `;
        return;
    }

    let html = '';
    entries.forEach(entry => {
        const statusClass = 'status-' + entry.status;
        const statusLabel = entry.status.charAt(0).toUpperCase() + entry.status.slice(1).replace('-', ' ');
        const nextDueText = entry.nextDue ? `<span>Next due: ${entry.nextDue}</span>` : '';
        const costText = entry.cost ? `$${entry.cost.toFixed(2)}` : '';

        html += `<div class="maint-card" data-id="${entry.id}">
            <div class="maint-card-header">
                <div>
                    <span class="category-tag">${entry.category}</span>
                    <div class="maint-card-title">${entry.title}</div>
                </div>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            <div class="maint-card-meta">
                ${entry.date ? `<span>Date: ${entry.date}</span>` : ''}
                ${costText ? `<span>Cost: ${costText}</span>` : ''}
                ${nextDueText}
            </div>
            ${entry.notes ? `<div class="maint-card-notes">${entry.notes}</div>` : ''}
            <div class="detail-actions" style="margin-top:8px;">
                <button class="btn-sm btn-edit-maint" data-id="${entry.id}">Edit</button>
                <button class="btn-sm" style="background:#ef4444;color:white;border-color:#ef4444;" data-id="${entry.id}">Delete</button>
            </div>
        </div>`;
    });

    container.innerHTML = html;

    // Add event listeners
    container.querySelectorAll('.btn-edit-maint').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            editMaintenanceEntry(btn.dataset.id);
        });
    });

    container.querySelectorAll('.maint-card').forEach(card => {
        card.addEventListener('click', () => {
            editMaintenanceEntry(card.dataset.id);
        });
    });

    container.querySelectorAll('[data-id]:not(.btn-edit-maint)').forEach(btn => {
        if (btn.classList.contains('fa') || btn.tagName === 'BUTTON') {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this maintenance entry?')) {
                    HOdata.deleteMaintenance(btn.dataset.id);
                    renderMaintenanceList();
                }
            });
        }
    });
}

function editMaintenanceEntry(id) {
    const entry = HOdata.maintenance.find(m => m.id === id);
    if (!entry) return;

    // Open maintenance modal with existing data
    openModal(document.getElementById('modal-maintenance'));
    document.getElementById('modal-maintenance').querySelector('h3').textContent = 'Edit Entry';

    document.getElementById('maint-title').value = entry.title;
    document.getElementById('maint-category').value = entry.category;
    document.getElementById('maint-date').value = entry.date || '';
    document.getElementById('maint-status').value = entry.status;
    document.getElementById('maint-cost').value = entry.cost || '';
    document.getElementById('maint-next-due').value = entry.nextDue || '';
    document.getElementById('maint-notes').value = entry.notes || '';

    // Update save button
    const saveBtn = document.getElementById('modal-maintenance').querySelector('#maint-save');
    const originalOnclick = saveBtn.onclick;
    saveBtn.onclick = () => {
        const updates = {
            title: document.getElementById('maint-title').value,
            category: document.getElementById('maint-category').value,
            date: document.getElementById('maint-date').value,
            status: document.getElementById('maint-status').value,
            cost: parseFloat(document.getElementById('maint-cost').value) || 0,
            nextDue: document.getElementById('maint-next-due').value,
            notes: document.getElementById('maint-notes').value
        };

        if (!updates.title) {
            alert('Title is required');
            return;
        }

        HOdata.updateMaintenance(id, updates);
        renderMaintenanceList();
        closeModal(document.getElementById('modal-maintenance'));
        saveBtn.onclick = originalOnclick;
    };
}

// ============================================================
// Property Info Form
// ============================================================
function loadPropertyForm() {
    document.getElementById('prop-lot').value = HOdata.property.lotSize || '';
    document.getElementById('prop-year').value = HOdata.property.yearBuilt || '';
    document.getElementById('prop-area').value = HOdata.property.livingArea || '';
    document.getElementById('prop-stories').value = HOdata.property.stories || '';
    document.getElementById('prop-foundation').value = HOdata.property.foundation || '';
    document.getElementById('prop-roof').value = HOdata.property.roofType || '';
    document.getElementById('prop-exterior').value = HOdata.property.exterior || '';
    document.getElementById('prop-siding').value = '';
    document.getElementById('prop-notes').value = HOdata.property.notes || '';
}

function savePropertyForm() {
    HOdata.property.lotSize = document.getElementById('prop-lot').value;
    HOdata.property.yearBuilt = document.getElementById('prop-year').value;
    HOdata.property.livingArea = document.getElementById('prop-area').value;
    HOdata.property.stories = document.getElementById('prop-stories').value;
    HOdata.property.foundation = document.getElementById('prop-foundation').value;
    HOdata.property.roofType = document.getElementById('prop-roof').value;
    HOdata.property.exterior = document.getElementById('prop-exterior').value;
    HOdata.property.notes = document.getElementById('prop-notes').value;
    HOdata.save();
    updatePropertyDisplay();
}

function updatePropertyDisplay() {
    const p = HOdata.property;
    document.getElementById('lot-size-display').textContent = p.lotSize || '—';
    document.getElementById('year-built-display').textContent = p.yearBuilt || '—';
    document.getElementById('living-area-display').textContent = p.livingArea || '—';
    document.getElementById('stories-display').textContent = p.stories || '—';
    document.getElementById('foundation-display').textContent = p.foundation || '—';
    document.getElementById('roof-type-display').textContent = p.roofType || '—';
    document.getElementById('exterior-display').textContent = p.exterior || '—';
}

// ============================================================
// Export/Import
// ============================================================
function exportData() {
    const data = HOdata.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'open-house-map-159-stone-lake-court.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = HOdata.importData(e.target.result);
        if (result.success) {
            alert('Data imported successfully!');
            location.reload();
        } else {
            alert('Error importing data: ' + result.error);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
