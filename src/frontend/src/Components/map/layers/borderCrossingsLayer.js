// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { borderCrossingStyles } from '../../data/featureStyleDefinitions.js';

export function getBorderCrossingsLayer(
  borderCrossings,
  projectionCode,
  mapContext,
) {
  return new VectorLayer({
    classname: 'borderCrossings',
    visible: true,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        borderCrossings.forEach(borderCrossing => {
          // Build a new OpenLayers feature
          const olGeometry = new Point(borderCrossing.location.coordinates);
          const olFeature = new ol.Feature({ geometry: olGeometry, type: 'borderCrossing' });

          // Transfer properties
          olFeature.setProperties(borderCrossing);

          // Transform the projection
          const olFeatureForMap = transformFeature(
            olFeature,
            'EPSG:4326',
            projectionCode,
          );

          // feature ID to advisory ID for retrieval
          olFeatureForMap.setId(borderCrossing.id);

          vectorSource.addFeature(olFeatureForMap);
        });
      },
    }),

    style: () => borderCrossingStyles.static,
  });
}
