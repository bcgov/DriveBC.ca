// Internal imports
import { getMidPoint, setEventStyle } from '../helpers';

// OpenLayers
import { Point, LineString, Polygon } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

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

    // Helper function to add features to relative VectorSource
    const addFeature = (feature, display_category) => {
      const geoType = feature.getGeometry().getType();
      const isLineSegment = geoType === 'LineString' || geoType === 'Polygon';
      if (isLineSegment && display_category === 'chainUps') {
        return; // DBC22-2936: currently not displaying chain up lines/polygons
      }

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

      // Add feature to vs
      const vs = isLineSegment ? lineVsMap[display_category] : vsMap[display_category];

      vs.addFeature(feature);
    }

    const currentProjection = mapRef.current.getView().getProjection().getCode();

    // Add features to VectorSources for each event
    eventsData.forEach((event) => {
      // all events have a point coordinate for an icon; for line or zone
      // events, the point is the median lat/long in the lineString
      const pointFeature = new ol.Feature({
        ...event,
        type: 'event',
        geometry: new Point(getMidPoint(event.location)),
      });
      pointFeature.setId(event.id);
      pointFeature.getGeometry().transform('EPSG:4326', currentProjection);
      addFeature(pointFeature, event.display_category);

      if (referenceData?.type === 'event' && event.id == referenceData?.id) {
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
        addFeature(feature, event.display_category);
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
          addFeature(feature, event.display_category);
          all.push(feature);
          return all;
        }, []);

        pointFeature.set('altFeature', features);
      }
    });

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

export function updateEventsLayers(events, mapLayers, setLoadingLayers) {
  const eventsDict  = events.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  // iterate through all map layers
  Object.values(mapLayers.current).forEach((layer) => {
    if (layer.get('classname') !== 'events') { return; }  // skip non-event layers

    // for each feature in a layer, set the style or hide the
    // feature, depending on whether the event is current
    for (const feature of layer.getSource().getFeatures()) {
      if (feature.getId() in eventsDict) {
        // Update the feature with the new event data
        feature.setProperties(eventsDict[feature.id_]);
        setEventStyle(feature, 'static');

      } else {
        feature.setStyle(new Style(null));
      }
    }
  });

  setLoadingLayers(prevState => ({
    ...prevState,
    events: false
  }));
}
