// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { cameraStyles } from '../../data/featureStyleDefinitions.js';

export function getCamerasLayer(cameras, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  const vectorSource = new VectorSource();

  cameras.forEach(camera => {
    // Build a new OpenLayers feature
    const olGeometry = new Point(camera.location.coordinates);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'camera' });

    // Transfer properties
    olFeature.setProperties(camera);

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );

    // feature ID to camera ID for retrieval
    olFeatureForMap.setId(camera.id);

    vectorSource.addFeature(olFeatureForMap);

    if (referenceData?.type === 'camera') {
      // Update the reference feature if one of the cameras is the reference
      olFeatureForMap.getProperties().camGroup.forEach((cam) => {
        if (cam.id == referenceData.id) {
          updateReferenceFeature(olFeatureForMap);
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
  const camsDict = cameras.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const camFeature of layer.getSource().getFeatures()) {
    const camId = camFeature.getId();
    const matchingCamera = cameras.find(preCam => preCam.id === camId);
    const isUpdated = camFeature.values_.last_update_modified !== matchingCamera.last_update_modified;
    if (camId in camsDict) {
      camFeature.setProperties(camsDict[camId]);
      if (!isUpdated) {
        if(camFeature.getStyle() === cameraStyles.cameras_unread['static'] 
        || camFeature.getStyle() === cameraStyles['active']
        ) {
            continue;
        }
        camFeature.setStyle(camsDict[camFeature.getId()] ? cameraStyles['static'] : new Style(null));
      } else {
        if(camFeature.getStyle() !== cameraStyles['active']){
          camFeature.setStyle(camsDict[camFeature.getId()] ? cameraStyles.cameras_unread['static'] : new Style(null));
        }
        camFeature.updated = true;  
        }
      } else {
        camFeature.setStyle(new Style(null));
      }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    cameras: false
  }));
}
