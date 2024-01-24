// Components and functions
import { getEventIcon, transformFeature } from '../helper.js';

// OpenLayers
import { Point, LineString } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export function loadEventsLayers(
  eventsData,
  mapContext,
  mapLayers,
  mapRef
) {
  // Helper function for initializing vss
  const createVS = () => new VectorSource({
    format: new GeoJSON()
  });

  if (eventsData) {
    // Initialize vss
    const closureVS = createVS();
    const closureLinesVS = createVS();
    const majorEventsVS = createVS();
    const majorEventsLinesVS = createVS();
    const minorEventsVS = createVS();
    const minorEventsLinesVS = createVS();
    const futureEventsVS = createVS();
    const futureEventsLinesVS = createVS();
    const roadConditionsVS = createVS();
    const roadConditionsLinesVS = createVS();

    // Helper function to add features to relative vs
    const addFeature = (feature, display_category) => {
      const isLineSegment = feature.getGeometry().getType() === 'LineString';

      const vsMap = {
        closures: closureVS,
        majorEvents: majorEventsVS,
        minorEvents: minorEventsVS,
        futureEvents: futureEventsVS,
        roadConditions: roadConditionsVS
      }

      const lineVsMap = {
        closures: closureLinesVS,
        majorEvents: majorEventsLinesVS,
        minorEvents: minorEventsLinesVS,
        futureEvents: futureEventsLinesVS,
        roadConditions: roadConditionsLinesVS
      }

      // Add feature to vs
      const vs = isLineSegment ? lineVsMap[display_category] : vsMap[display_category];
      vs.addFeature(feature);
    }

    // Helper function to call transform with set projections
    const transform = (feature) => {
      return transformFeature(
        feature,
        'EPSG:4326',
        mapRef.current.getView().getProjection().getCode(),
      )
    }

    // Add features to vss for each event
    eventsData.forEach(event => {
      // Create linestring features
      if (event.location.type == 'LineString') {
        // Center point display
        const eventCoords = event.location.coordinates;
        const eventFeature = new ol.Feature({
          geometry: new Point(
            eventCoords[ Math.floor(eventCoords.length / 2) ]
          )
        });
        eventFeature.setProperties(event);
        eventFeature.set('type', 'event');

        // Line display
        const eventLineFeature = new ol.Feature({
          geometry: new LineString(event.location.coordinates)
        });
        eventLineFeature.setProperties(event);
        eventLineFeature.set('type', 'event');

        // Transform event coordinates
        const eventTransformed = transform(eventFeature);
        const eventLineTransformed = transform(eventLineFeature);

        // Associate two features together for click handler
        eventTransformed.set('altFeature', eventLineTransformed);
        eventLineTransformed.set('altFeature', eventTransformed);

        // Add features to linestring and relative vs
        addFeature(eventTransformed, event.display_category);
        addFeature(eventLineTransformed, event.display_category);

      // Create point feature
      } else {
        const eventFeature = new ol.Feature({
          geometry: new Point(event.location.coordinates)
        });
        eventFeature.setProperties(event);
        eventFeature.set('type', 'event');

        // Transform event coordinates
        const eventTransformed = transform(eventFeature);

        // Add feature to relative vs
        addFeature(eventTransformed, event.display_category);
      }

      // Helper function to add layer to map
      const addLayer = (name, vs, zIndex) => {
        if (mapLayers.current[name]) {
          mapRef.current.removeLayer(mapLayers.current[name]);
        }

        mapLayers.current[name] = new VectorLayer({
          classname: 'events',
          visible: mapContext.visible_layers[name],
          source: vs,
          style: function (feature, resolution) {
            return getEventIcon(feature, 'static');
          },
        });

        mapRef.current.addLayer(mapLayers.current[name]);
        mapLayers.current[name].setZIndex(zIndex);
      }

      // Add layer to map for each vs
      addLayer('closures', closureVS, 128);
      addLayer('closuresLines', closureLinesVS, 42);
      addLayer('majorEvents', majorEventsVS, 118);
      addLayer('majorEventsLines', majorEventsLinesVS, 32);
      addLayer('minorEvents', minorEventsVS, 108);
      addLayer('minorEventsLines', minorEventsLinesVS, 22);
      addLayer('futureEvents', futureEventsVS, 98);
      addLayer('futureEventsLines', futureEventsLinesVS, 12);
      addLayer('roadConditions', roadConditionsVS, 88);
      addLayer('roadConditionsLines', roadConditionsLinesVS, 2);
    });
  }
}
