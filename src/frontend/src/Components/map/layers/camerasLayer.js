// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { cameraStyles, unreadCameraStyles } from '../../data/featureStyleDefinitions.js';

export function getCamerasLayer(cameras, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
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

  return new VectorLayer({
    classname: 'webcams',
    visible: mapContext.visible_layers.highwayCams,
    source: vectorSource,
    style: () => null
  });
}

export function updateCamerasLayer(cameras, layer, setLoadingLayers) {
  const camerasLookup = cameras.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const feature of layer.getSource().getFeatures()) {
    const camera = camerasLookup[feature.getId()];

    if (!camera) {  // camera no longer in list from API
      feature.setStyle(new Style(null));
      continue;
    }

    if (feature.get('last_update_modified') !== camera.last_update_modified) {
      feature.set('unread', true);
    }

    feature.setProperties(camera); // update feature with latest API data.

    if (feature.get('clicked')) { continue; }

    feature.setCameraStyle('static');
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    cameras: false
  }));
}
