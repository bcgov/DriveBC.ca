// Components and functions
import { transformFeature } from '../helper.js';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { ferryStyles } from '../../data/featureStyleDefinitions.js';

export function getFerriesLayer(ferriesData, projectionCode, mapContext) {
  return new VectorLayer({
    classname: 'ferries',
    visible: mapContext.visible_layers.ferriesLayer,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        ferriesData.forEach(ferry => {
          // Build a new OpenLayers feature
          const olGeometry = new Point(ferry.location.coordinates);
          const olFeature = new ol.Feature({ geometry: olGeometry });

          // Transfer properties
          olFeature.setProperties(ferry);

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
    style: ferryStyles['static'],
  });
}
