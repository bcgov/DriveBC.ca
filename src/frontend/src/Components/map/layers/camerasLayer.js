// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { cameraStyles } from '../../data/featureStyleDefinitions.js';

export function getCamerasLayer(cameras, projectionCode, mapContext, referenceData, updateReferenceFeature) {
  return new VectorLayer({
    classname: 'webcams',
    visible: mapContext.visible_layers.highwayCams,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

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
      },
    }),

    style: function (feature, resolution) {
      return cameraStyles['static'];
    }
  });
}
