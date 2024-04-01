// Components and functions
import { setEventStyle, transformFeature } from '../helper.js';

// OpenLayers
import { Point, LineString, Polygon } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Fill, Icon, Stroke, Style } from 'ol/style.js';
import Layer from 'ol/layer/Layer.js';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayerRenderer from 'ol/renderer/webgl/VectorLayer.js';
import VectorSource from 'ol/source/Vector';
import {packColor, parseLiteralStyle} from 'ol/webgl/styleparser.js';

import { eventStyles } from '../../data/featureStyleDefinitions.js';

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      className: this.getClassName(),
      style: eventStyles.polygon,
    });
  }
}

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

    // Helper function to add features to relative VectorSource
    const addFeature = (feature, display_category) => {
      const geoType = feature.getGeometry().getType();
      const isLineSegment = geoType === 'LineString' || geoType === 'Polygon';

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

    const currentProjection = mapRef.current.getView().getProjection().getCode();

    // Add features to VectorSources for each event
    eventsData.forEach((event) => {
      // location may have an object or an array of objects, so handle all
      // event locations as an array of objects
      if (!Array.isArray(event.location)) { event.location = [event.location]; }

      // all events have a point coordinate for an icon; for line or zone
      // events, the point is the median lat/long in the lineString
      const full = event.location.reduce(
        (full, location) => full.concat(location.coordinates),
        []
      );
      const coordinates = full[Math.floor(full.length / 2)];
      const pointFeature = new ol.Feature({
        ...event,
        type: 'event',
        geometry: new Point(coordinates),
      });
      pointFeature.setId(event.id);
      pointFeature.getGeometry().transform('EPSG:4326', currentProjection);
      addFeature(pointFeature, event.display_category);

      // polygons are generated backend and used if available
      if (event.polygon) {
        const feature = new ol.Feature({
          ...event,
          ...eventStyles.segments.roadConditions.static,
          type: 'event',
          layerType: 'webgl',
          altFeature: pointFeature,
          geometry: new Polygon(event.polygon.coordinates)
        });

        feature.getGeometry().transform('EPSG:4326', currentProjection);
        addFeature(feature, event.display_category);
        pointFeature.set('altFeature', feature);
      } else {
        const features = event.location.reduce((all, location, ii) => {
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
    const addLayer = (name, vs, zIndex, LayerType) => {
      if (mapLayers.current[name]) {
        mapRef.current.removeLayer(mapLayers.current[name]);
      }

      mapLayers.current[name] = new LayerType({
        classname: 'events',
        visible: mapContext.visible_layers[name],
        source: vs,
        style: function (feature, resolution) {
          return setEventStyle(feature, 'static');
        },
      });

      mapRef.current.addLayer(mapLayers.current[name]);
      mapLayers.current[name].setZIndex(zIndex);
    }

    // Add layer to map for each vs
    addLayer('closures', closureVS, 128, VectorLayer);
    addLayer('closuresLines', closureLinesVS, 42, VectorLayer);
    addLayer('majorEvents', majorEventsVS, 118, VectorLayer);
    addLayer('majorEventsLines', majorEventsLinesVS, 32, VectorLayer);
    addLayer('minorEvents', minorEventsVS, 108, VectorLayer);
    addLayer('minorEventsLines', minorEventsLinesVS, 22, VectorLayer);
    addLayer('futureEvents', futureEventsVS, 98, VectorLayer);
    addLayer('futureEventsLines', futureEventsLinesVS, 12, VectorLayer);
    addLayer('roadConditions', roadConditionsVS, 88, VectorLayer);
    addLayer('roadConditionsLines', roadConditionsLinesVS, 2, WebGLLayer);
  }
}