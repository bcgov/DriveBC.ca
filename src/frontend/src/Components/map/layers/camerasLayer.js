// OpenLayers
import { Point } from 'ol/geom';
import {Style, Fill, Stroke, Text} from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster.js';
import CircleStyle from 'ol/style/Circle.js';

// Styling
import { cameraStyles, unreadCameraStyles } from '../../data/featureStyleDefinitions.js';

export function getCamerasLayer(cameras, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers, pixelDistance) {
  const vectorSource = new VectorSource();

  cameras.forEach(camera => {
    const olGeometry = new Point(camera.location.coordinates);
    olGeometry.transform('EPSG:4326', projectionCode);

    const feature = new ol.Feature({ geometry: olGeometry, type: 'camera' });
    feature.setProperties(camera);
    feature.setId(camera.id);

    // special function for setting the feature's style, to centralize where
    // style is differentiated based on the 'unread' property
    feature.setCameraStyle = function (key) {
      if (this.get('unread')) {
        this.setStyle(unreadCameraStyles[key])
      } else {
        this.setStyle(cameraStyles[key]);
      }
    }

    vectorSource.addFeature(feature);

    // Update the reference feature if one of the cameras is the reference
    if (referenceData?.type === 'camera') {
      feature.get('camGroup').forEach((cam) => {
        if (cam.id == referenceData.id) {  // Intentional loose equality for string IDs
          if (referenceData.focusCamera) {
            feature.set('focusCamera', referenceData.focusCamera);
            feature.set('zoom', referenceData.zoom);
            feature.set('pan', referenceData.pan);
          }

          updateReferenceFeature(feature);
        }
      });
    }
  });

  const clusterSource = new Cluster({
    distance: pixelDistance,
    source: vectorSource,
  });

  const styleCache = {};

  const layer = new VectorLayer({
    classname: 'webcams',
    visible: mapContext.visible_layers.highwayCams,
    source: clusterSource,

    style: function (feature) {
      const features = feature.get('features');
      const size = features.length;

      // single camera
      if (size === 1) {
        const cam = features[0];

        if (cam.get('clicked')) {
          return cameraStyles.active;
        }
        if (cam.get('hovered')) {
          return cameraStyles.hover;
        }
        else {
          return cameraStyles.static;
        }
      }

      // cluster
      let style = styleCache[size];

      if (!style) {
        style = new Style({
          image: new CircleStyle({
            radius: 10,
            stroke: new Stroke({ color: '#fff' }),
            fill: new Fill({ color: '#3399CC' }),
          }),
          text: new Text({
            text: String(size),
            fill: new Fill({ color: '#fff' }),
          }),
        });

        styleCache[size] = style;
      }

      return style;
    },
  });

  layer.getClusterSource = () => clusterSource;

  return layer;
}

export function updateCamerasLayer(cameras, layer, setLoadingLayers) {
  const camerasLookup = cameras.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const feature of layer.getSource().getFeatures()) {
    let camera = camerasLookup[feature.getId()];
    if (!camera) {
      camera = camerasLookup[feature.values_.features[0].getId()];
    }
    

    if (!camera) {  // camera no longer in list from API
      feature.setStyle(new Style(null));
      continue;
    }

    if (feature.get('last_update_modified') !== camera.last_update_modified) {
      feature.set('unread', true);
    }

    feature.setProperties(camera); // update feature with latest API data.

    if (feature.get('clicked')) { continue; }
    try {
      feature.setCameraStyle('static');
    }
    catch {
      feature.values_.features[0].setCameraStyle('static');
    }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    cameras: false
  }));
}