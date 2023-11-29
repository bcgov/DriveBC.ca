// Components and functions
import { transformFeature } from '../helper.js';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { cameraStyles } from '../../data/featureStyleDefinitions.js';

export function getCamerasLayer(
  cameras,
  projectionCode,
  mapContext,
  passedCamera,
  updateClickedCamera,
) {
  return new VectorLayer({
    classname: 'webcams',
    visible: mapContext.visible_layers.webcamsLayer,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        cameras.forEach(camera => {
          // Build a new OpenLayers feature
          const olGeometry = new Point(camera.location.coordinates);
          const olFeature = new ol.Feature({ geometry: olGeometry });

          // Transfer properties
          olFeature.setProperties(camera);

          // Transform the projection
          const olFeatureForMap = transformFeature(
            olFeature,
            'EPSG:4326',
            projectionCode,
          );

          if (
            passedCamera &&
            passedCamera.id === olFeatureForMap.getProperties().id
          ) {
            updateClickedCamera(olFeatureForMap);
            olFeatureForMap.setProperties({ clicked: true }, true);
          }
          vectorSource.addFeature(olFeatureForMap);
        });
      },
    }),

    style: function (feature, resolution) {
      if (passedCamera && passedCamera.id === feature.getProperties().id) {
        return cameraStyles['active'];
      }
      return cameraStyles['static'];
    },
  });
}
