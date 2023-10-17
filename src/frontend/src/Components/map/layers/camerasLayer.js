// Components and functions
import { transformFeature } from '../helper.js';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import Cluster from 'ol/source/Cluster.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { cameraStyles } from '../../data/eventStyleDefinitions.js';

export function getCamerasLayer(camerasData, projectionCode, mapContext) {
  return new VectorLayer({
    classname: 'webcams',
    visible: mapContext.visible_layers.webcamsLayer,
    source: new Cluster({
      distance: 35,
      source: new VectorSource({
        format: new GeoJSON(),
        loader: function (extent, resolution, projection) {
          const vectorSource = this;
          vectorSource.clear();

          camerasData.forEach(camera => {
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

            vectorSource.addFeature(olFeatureForMap);
          });
        },
      }),
    }),
    style: cameraStyles['static'],
  });
}