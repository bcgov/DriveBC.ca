// Internal imports
import { savePointFeature, getMidPoint, setEventStyle, offsetCoordinates } from '../helpers';

// OpenLayers
import { Point, LineString, Polygon } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Helper function to add features to relative VectorSource
const addFeature = (feature, display_category, vsMap, lineVsMap, setNewFeatureStyle) => {
  const geoType = feature.getGeometry().getType();
  const isLineSegment = geoType === 'LineString' || geoType === 'Polygon';
  if (isLineSegment && display_category === 'chainUps') {
    return; // DBC22-2936: currently not displaying chain up lines/polygons
  }

  // Add feature to vs
  const vs = isLineSegment ? lineVsMap[display_category] : vsMap[display_category];

  vs.addFeature(feature);

  if (setNewFeatureStyle) {
    setEventStyle(feature, 'static');
  }
}

// Helper function that creates a feature and updates its properties for each event
const processEvent = (mapContext, event, currentProjection, vsMap, lineVsMap, referenceData, updateReferenceFeature, setNewFeatureStyle=false) => {
  let eventFound = false;

  // all events have a point coordinate for an icon; for line or zone
  // events, the point is the median lat/long in the lineString
  const pointFeature = new ol.Feature({
    ...event,
    type: 'event',
    geometry: new Point(getMidPoint(mapContext, event.location)),
  });
  pointFeature.setId(event.id);
  pointFeature.getGeometry().transform('EPSG:4326', currentProjection);
  addFeature(pointFeature, event.display_category, vsMap, lineVsMap, setNewFeatureStyle);

  if (event.location.type === 'Point') {
    savePointFeature(mapContext, event, pointFeature);
  }

  if (referenceData?.type === 'event' && event.id == referenceData?.id) {  // Intentional loose equality for string IDs
    updateReferenceFeature(pointFeature);
    eventFound = true;
  }

  // polygons are generated backend and used if available
  if (event.polygon) {
    const feature = new ol.Feature({
      ...event,
      type: 'event',
      altFeature: pointFeature,
      geometry: new Polygon(event.polygon.coordinates)
    });
    feature.setId(event.id);

    feature.getGeometry().transform('EPSG:4326', currentProjection);
    addFeature(feature, event.display_category, vsMap, lineVsMap, setNewFeatureStyle);
    pointFeature.set('altFeature', feature);

  } else {
    // location may have an object or an array of objects, so handle all
    // event locations as an array of objects
    const locationData = !Array.isArray(event.location) ? [event.location] : event.location;

    const features = locationData.reduce((all, location, ii) => {
      const geometry = location.type === 'LineString'
        ? new LineString(location.coordinates)
        : new Point(location.coordinates);

      const feature = new ol.Feature({
        ...event,
        type: 'event',
        altFeature: pointFeature,
        geometry,
      });
      feature.setId(event.id);

      feature.getGeometry().transform('EPSG:4326', currentProjection);
      addFeature(feature, event.display_category, vsMap, lineVsMap, setNewFeatureStyle);
      all.push(feature);
      return all;
    }, []);

    pointFeature.set('altFeature', features);
  }

  return eventFound;
}

export function loadEventsLayers(eventsData, mapContext, mapLayers, mapRef, referenceData, updateReferenceFeature, setLoadingLayers) {
  // Helper function for initializing vss
  const createVS = () => new VectorSource({
    format: new GeoJSON()
  });

  let eventFound = false;

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
    const chainUpsVS = createVS();
    const chainUpsLinesVS = createVS();

    const vsMap = {
      closures: closureVS,
      majorEvents: majorEventsVS,
      minorEvents: minorEventsVS,
      futureEvents: futureEventsVS,
      roadConditions: roadConditionsVS,
      chainUps: chainUpsVS,
    }

    const lineVsMap = {
      closures: closureLinesVS,
      majorEvents: majorEventsLinesVS,
      minorEvents: minorEventsLinesVS,
      futureEvents: futureEventsLinesVS,
      roadConditions: roadConditionsLinesVS,
      chainUps: chainUpsLinesVS,
    }

    const currentProjection = mapRef.current.getView().getProjection().getCode();

    // Reset events dict for offsetting overlaps
    mapContext.events = {};

    // Add features to VectorSources for each event
    for (const event of eventsData) {
      eventFound = processEvent(mapContext, event, currentProjection, vsMap, lineVsMap, referenceData, updateReferenceFeature);
      if (eventFound) {
        break;
      }
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
        style: () => null
      });

      mapRef.current.addLayer(mapLayers.current[name]);
      mapLayers.current[name].setZIndex(zIndex);
      mapLayers.current[name].name = name;
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
    addLayer('roadConditionsLines', roadConditionsLinesVS, 1);
    addLayer('chainUps', chainUpsVS, 88);
    addLayer('chainUpsLines', chainUpsLinesVS, 2);

    setLoadingLayers(prevState => ({
      ...prevState,
      events: false
    }));
  }

  return eventFound;
}

export function updateEventsLayers(mapContext, events, mapLayers, setLoadingLayers, referenceData, mapView) {
  const featuresDict = {};

  const eventsDict = events.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  // iterate through all map layers
  const processedEvents = new Set();
  Object.values(mapLayers.current).forEach((layer) => {
    if (layer.get('classname') !== 'events') { return; }  // skip non-event layers

    // for each feature in a layer, set the style or hide the
    // feature, depending on whether the event is current
    for (const feature of layer.getSource().getFeatures()) {
      updateOverlappingEventPosition(feature, mapContext, mapView);

      const featureId = feature.getId();
      if (featureId in eventsDict) {
        // Update the feature with the new event data
        feature.setProperties(eventsDict[featureId]);
        setEventStyle(feature, referenceData.id === featureId ? 'active' : 'static');
        processedEvents.add(featureId);  // Track processed events
        featuresDict[featureId] = feature;

      // Hide the feature if not in filtered data list
      } else {
        feature.setStyle(new Style(null));
      }
    }
  });

  const vsMap = {};
  const lineVsMap = {};

  const layerKeys = ['closures', 'majorEvents', 'minorEvents', 'futureEvents', 'roadConditions', 'chainUps'];
  for (const key of layerKeys) {
    vsMap[key] = mapLayers.current[key].getSource();
    lineVsMap[key] = mapLayers.current[key + 'Lines'].getSource();
  }

  // Iterate through unprocessed new events and create features for them
  Object.values(eventsDict).forEach((event) => {
    if (processedEvents.has(event.id)) { return; }

    processEvent(mapContext, event, 'EPSG:3857', vsMap, lineVsMap, null, null, true);
  });

  setLoadingLayers(prevState => ({
    ...prevState,
    events: false
  }));

  return featuresDict;
}

// Iterate through all event layers and update overlapping positions for each feature
export const updateOverlappingPositions = (mapLayers, mapContext, mapView) => {
  const eventLayers = ['closures', 'majorEvents', 'minorEvents', 'futureEvents', 'roadConditions', 'chainUps'];
  eventLayers.forEach((layerKey) => {
    // Iterate through features of each event layer
    const layer = mapLayers.current[layerKey];
    if (layer) {
      layer.getSource().getFeatures().forEach((feature) => {
        updateOverlappingEventPosition(feature, mapContext, mapView);
      });
    }
  });
}

// Update the position of an overlapping event based on its index
export const updateOverlappingEventPosition = (feature, mapContext, mapView) => {
  if (feature.get('locationIndex')) {
    // Do not update if there is only one event at the point
    const eventsAtPoint = mapContext.events[feature.get('locationIndex')];
    if (!eventsAtPoint) {
      return;
    }

    if (eventsAtPoint.length > 1) {
      const eventIndex = eventsAtPoint.indexOf(feature.get('id'));

      // Skip the event at center
      if (eventIndex > 0) {
        const parsedCoords = feature.get('locationIndex').split(',').map((stringCoords) => Number(stringCoords));
        const coords = offsetCoordinates(
          parsedCoords,
          eventIndex,
          eventsAtPoint.length - 1,  // Exclude the event at center
          mapView.current.getResolution()
        );

        // Transform and set new geometry
        const newGeometry = new Point(coords);
        newGeometry.transform('EPSG:4326', mapView.current.getProjection().getCode());
        feature.setGeometry(newGeometry);
      }
    }
  }
}
