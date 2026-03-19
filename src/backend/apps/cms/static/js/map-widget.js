(function() {
    'use strict';

    let map, editLayer, modify, translate, select;
    let currentMode = null; // 'draw' | 'selected' | 'move' | 'edit'
    const geomFieldId = 'id_geometry';

    let undoStack = [];
    const maxUndoSteps = 20;

    let defaultStyle, selectedStyle;

    // Init
    function initEditingControls() {
        if (typeof ol === 'undefined') { setTimeout(initEditingControls, 500); return; }

        const mapElement = document.querySelector('#id_geometry_map') || document.querySelector('.dj_map');
        if (!mapElement) { setTimeout(initEditingControls, 500); return; }

        const mapWidget = globalThis.geodjango_geometry;
        if (!mapWidget?.map) { setTimeout(initEditingControls, 500); return; }

        map = mapWidget.map;

        createStyles();
        setupEditLayer();
        injectToolbar();
        setupKeyboardShortcuts();
        setupSaveHook();
        enterDrawMode(); // default mode on load

        console.log('map-widget initialized');
    }

    // Styles
    function createStyles() {
        defaultStyle = new ol.style.Style({
            fill: new ol.style.Fill({ color: 'rgba(255, 204, 51, 0.3)' }),
            stroke: new ol.style.Stroke({ color: '#ffcc33', width: 3 }),
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: '#ffcc33' })
            })
        });

        selectedStyle = new ol.style.Style({
            fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.4)' }),
            stroke: new ol.style.Stroke({ color: '#ff0000', width: 4 }),
            zIndex: 1000
        });
    }

    // Edit Layer
    function setupEditLayer() {
        const vectorSource = new ol.source.Vector();
        editLayer = new ol.layer.Vector({
            source: vectorSource,
            zIndex: 9999,
            style: function(feature) {
                const selectedArray = select ? select.getFeatures().getArray() : [];
                return selectedArray.includes(feature) ? selectedStyle : defaultStyle;
            }
        });
        map.addLayer(editLayer);

        // Hide the GeoDjango widget overlay
        globalThis.geodjango_geometry?.featureOverlay?.setVisible(false);

        // Load existing saved features
        loadExistingFeatures();

        // Capture newly drawn polygons via GeoDjango's Draw interaction
        map.getInteractions().forEach(function(interaction) {
            if (interaction instanceof ol.interaction.Draw) {
                interaction.on('drawend', function(evt) {
                    pushUndoState();
                    const cloned = evt.feature.clone();
                    cloned.setStyle(null);
                    editLayer.getSource().addFeature(cloned);
                    updateHiddenField();
                    // After completing a polygon, stay in draw mode
                    enterDrawModeDelayed();
                });
            }
        });
    }

    function enterDrawModeDelayed() {
        setTimeout(enterDrawMode, 50);
    }

    function loadExistingFeatures() {
        const geomInput = document.getElementById(geomFieldId);
        if (geomInput?.value) {
            try {
                const format = new ol.format.GeoJSON();
                const features = format.readFeatures(geomInput.value);
                splitMultiPolygons(features).forEach(function(f) {
                    f.setStyle(null);
                    editLayer.getSource().addFeature(f);
                });
                return;
            } catch(e) {
                console.error('Error loading from input:', e);
            }
        }

        // Fall back to featureOverlay source
        const overlaySource = globalThis.geodjango_geometry?.featureOverlay?.getSource
            ? globalThis.geodjango_geometry.featureOverlay.getSource()
            : null;
        if (overlaySource && typeof overlaySource.getFeatures === 'function') {
            overlaySource.getFeatures().forEach(function(f) {
                const cloned = f.clone();
                cloned.setStyle(null);
                editLayer.getSource().addFeature(cloned);
            });
        }
    }

    function splitMultiPolygons(features) {
        const result = [];
        features.forEach(function(f) {
            const geom = f.getGeometry();
            if (geom.getType() === 'MultiPolygon') {
                geom.getPolygons().forEach(function(poly) {
                    result.push(new ol.Feature(poly));
                });
            } else {
                result.push(f);
            }
        });
        return result;
    }

    // Mode Management
    // DRAW     – default; clicking empty space draws; clicking a polygon selects it
    // SELECTED – polygon is selected (red highlight); delete/move/edit available
    // MOVE     – drag selected polygon to reposition
    // EDIT     – drag vertices to reshape any polygon
    function clearInteractions() {
        if (translate) { map.removeInteraction(translate); translate = null; }
        if (modify)    { map.removeInteraction(modify);    modify    = null; }
        if (select)    { select.getFeatures().clear(); map.removeInteraction(select); select = null; }
        setGeoDjangoDrawActive(true);
        if (editLayer) editLayer.changed();
    }

    function setGeoDjangoDrawActive(active) {
        map.getInteractions().forEach(function(interaction) {
            if (interaction instanceof ol.interaction.Draw) {
                interaction.setActive(active);
            }
        });
    }

    function enterDrawMode() {
        clearInteractions();
        currentMode = 'draw';
        updateToolbarState();

        // Attach a select interaction even in draw mode so clicking a polygon
        // switches to selected mode automatically
        select = new ol.interaction.Select({
            layers: [editLayer],
            hitTolerance: 6,
            multi: false,
            condition: ol.events.condition.singleClick,
            style: function(feature) { return selectedStyle; }
        });
        map.addInteraction(select);

        select.on('select', function(e) {
            if (e.selected.length > 0) {
                enterSelectedMode();
            }
        });

        setStatus('Draw mode: click on the map to start drawing a polygon. Click an existing polygon to select it.');
    }

function enterSelectedMode() {
    setGeoDjangoDrawActive(false);
    if (translate) { map.removeInteraction(translate); translate = null; }
    if (modify)    { map.removeInteraction(modify);    modify    = null; }
    currentMode = 'selected';
    updateToolbarState();

    // Translate: drag to move
    translate = new ol.interaction.Translate({
        features: select.getFeatures(),
        hitTolerance: 5
    });
    translate.on('translatestart', function() {
        pushUndoState();
    });
    translate.on('translateend', function() {
        updateHiddenField();
        syncFeatureCollection();
    });
    map.addInteraction(translate);

    // Modify: always active so user can drag vertices or Shift/Alt+Click to delete them
    modify = new ol.interaction.Modify({
        source: editLayer.getSource(),
        deleteCondition: function(evt) {
            return ol.events.condition.singleClick(evt) &&
                   (evt.originalEvent.shiftKey || evt.originalEvent.altKey);
        }
    });
    modify.on('modifystart', function() {
        pushUndoState();
    });
    modify.on('modifyend', function() {
        updateHiddenField();
        syncFeatureCollection();
    });
    map.addInteraction(modify);

    editLayer.changed();
    map.render();
    setStatus('Selected. Drag polygon to move. Drag a vertex to reshape. Shift+Click or Alt+Click a vertex to delete it.');
}


    function deselectAndDraw() {
        enterDrawMode();
        setStatus('Draw mode: click on the map to start drawing a polygon. Click an existing polygon to select it.');
    }

    // Toolbar
    function injectToolbar() {
        const mapElement = document.querySelector('#id_geometry_map') || document.querySelector('.dj_map');
        if (!mapElement) return;
        const container = mapElement.parentElement;
        if (!container || document.getElementById('map-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'map-toolbar';
        
        // show or hide the toolbar
        toolbar.style.cssText = [
            'position:absolute', 'top:10px', 'left:70px', 'z-index:1000',
            'background:white', 'padding:6px 10px', 'border-radius:6px',
            'box-shadow:0 2px 6px rgba(0,0,0,0.25)', 'font-family:sans-serif',
            'font-size:13px', 'display:flex', 'align-items:center', 'gap:8px',
            // 'font-size:13px', 'display:none',
            'align-items:center', 'gap:8px'
        ].join(';');

        toolbar.innerHTML =
            '<span id="map-mode-indicator" style="' +
                'padding:4px 12px;border-radius:4px;font-weight:bold;' +
                'min-width:90px;text-align:center;color:white;background:#1976d2;' +
            '">✏ Draw</span>' +
            '<button type="button" id="btn-delete" style="' +
                'padding:4px 10px;cursor:pointer;color:white;background:#e53935;' +
                'border:none;border-radius:4px;font-size:13px;' +
            '" title="Delete selected polygon (Del)">🗑 Delete</button>' +
            '<button type="button" id="btn-undo" style="' +
                'padding:4px 10px;cursor:pointer;background:#f5f5f5;' +
                'border:1px solid #ccc;border-radius:4px;font-size:13px;' +
            '" title="Undo (Ctrl+Z)">↩ Undo</button>' +
            '<span id="map-status" style="font-size:11px;color:#666;max-width:300px;"></span>';

        container.insertBefore(toolbar, container.firstChild);

        // Prevent toolbar clicks from propagating to the map
        toolbar.addEventListener('click', function(e) { e.stopPropagation(); });
        toolbar.addEventListener('mousedown', function(e) { e.stopPropagation(); });

        document.getElementById('btn-delete').addEventListener('click', function(e) {
            e.preventDefault();
            deleteSelected();
        });
        document.getElementById('btn-undo').addEventListener('click', function(e) {
            e.preventDefault();
            undo();
        });
    }

    function updateToolbarState() {
        const indicator = document.getElementById('map-mode-indicator');
        if (!indicator) return;
        const labels = {
            'draw':     { text: '✏ Draw',     bg: '#1976d2' },
            'selected': { text: '◉ Selected', bg: '#e65100' },
            'move':     { text: '↔ Move',     bg: '#6a1b9a' },
            'edit':     { text: '⬡ Edit vtx', bg: '#2e7d32' }
        };
        const info = labels[currentMode] || { text: currentMode, bg: '#333' };
        indicator.textContent = info.text;
        indicator.style.background = info.bg;
    }

    function setStatus(msg) {
        const el = document.getElementById('map-status');
        if (el) el.textContent = msg;
    }

    // Keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable ||
                e.target.closest('[contenteditable="true"]')
            ) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault(); undo(); return;
            }

            switch(e.key) {
                case 'Escape':
                case 's': case 'S':
                    e.preventDefault(); deselectAndDraw(); break;
                case 'Delete': case 'Backspace':
                    e.preventDefault(); deleteSelected(); break;
            }
        });

        // Clicking empty map space while a polygon is selected to deselect
        map.on('click', function(e) {
            if (currentMode !== 'selected' && currentMode !== 'move') return;
            const hit = map.hasFeatureAtPixel(e.pixel, {
                layerFilter: function(l) { return l === editLayer; }
            });
            if (!hit) {
                deselectAndDraw();
            }
        });
    }

    // Delete
    function deleteSelected() {
        if (!select || select.getFeatures().getLength() === 0) {
            setStatus('No polygon selected. Click a polygon first, then delete.');
            return;
        }

        pushUndoState();

        const featuresToRemove = select.getFeatures().getArray().slice();
        select.getFeatures().clear();
        featuresToRemove.forEach(function(f) {
            editLayer.getSource().removeFeature(f);
        });

        // Flush OL's select overlay by removing and nulling the interaction
        map.removeInteraction(select);
        select = null;

        syncFeatureCollection();
        updateHiddenField();
        editLayer.changed();
        map.render();

        enterDrawMode();
        setStatus('Polygon deleted.');
    }

    // Undo
    function pushUndoState() {
        if (!editLayer) return;
        undoStack.push(new ol.format.GeoJSON().writeFeatures(editLayer.getSource().getFeatures()));
        if (undoStack.length > maxUndoSteps) undoStack.shift();
    }

    function undo() {
        if (!editLayer || undoStack.length === 0) return;
        const features = new ol.format.GeoJSON().readFeatures(undoStack.pop());
        editLayer.getSource().clear();
        editLayer.getSource().addFeatures(features);
        syncFeatureCollection();
        updateHiddenField();
        enterDrawMode();
        setStatus('Undo applied.');
    }

    // Sync & Save
    function syncFeatureCollection() {
        const collection = globalThis.geodjango_geometry.featureCollection;
        collection.clear();
        editLayer.getSource().getFeatures().forEach(function(f) {
            collection.push(f.clone());
        });
    }

    function updateHiddenField() {
        if (!editLayer) return;
        const geomInput = document.getElementById(geomFieldId);
        if (!geomInput) return;

        const features = editLayer.getSource().getFeatures();
        if (features.length === 0) {
            geomInput.value = '';
            return; // NO triggerChange
        }

        const polygons = features
            .map(function(f) { return f.getGeometry(); })
            .filter(function(g) { return g && (g.getType() === 'Polygon' || g.getType() === 'MultiPolygon'); });

        if (polygons.length === 0) {
            geomInput.value = '';
        } else {
            const coords = polygons.map(function(p) {
                return p.getType() === 'Polygon' ? p.getCoordinates() : p.getCoordinates()[0];
            });
            geomInput.value = new ol.format.GeoJSON().writeGeometry(new ol.geom.MultiPolygon(coords));
        }
    }

    function setupSaveHook() {
        const originalFormData = window.FormData;
        window.FormData = function(form) {
            if (form) {
                // Force our correct geometry value into the field before FormData reads it
                updateHiddenField();
                console.log('FormData intercepted, geometry:', 
                    document.getElementById('id_geometry')?.value?.substring(0, 80));
            }
            return new originalFormData(form);
        };
        window.FormData.prototype = originalFormData.prototype;
    }

    function triggerChange(element) {
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Boot

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(initEditingControls, 500); });
    } else {
        setTimeout(initEditingControls, 500);
    }

})();
