// Components and functions
import { transformFeature } from '../helper.js';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { restStopStyles } from '../../data/featureStyleDefinitions.js';

export function getRestStopsLayer(restStopsData, projectionCode, mapContext) {
  return new VectorLayer({
    classname: 'restStops',
    visible: mapContext.visible_layers.restStops,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        restStopsData.forEach(restStop => {
          // Build a new OpenLayers feature
          const olGeometry = new Point(restStop.location.coordinates);
          const olFeature = new ol.Feature({ geometry: olGeometry });

          // Transfer properties
          olFeature.setProperties(restStop);
          olFeature.set('type', 'rest');

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
    style: restStopStyles['static'],
  });
}
