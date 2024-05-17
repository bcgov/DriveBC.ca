// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { MultiPolygon } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { advisoryStyles } from '../../data/featureStyleDefinitions.js';

export function getAdvisoriesLayer(
  advisories,
  projectionCode,
  mapContext,
) {
  return new VectorLayer({
    classname: 'advisories',
    visible: true,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        advisories.forEach(advisory => {
          // Build a new OpenLayers feature
          const olGeometry = new MultiPolygon(advisory.geometry.coordinates);
          const olFeature = new ol.Feature({ geometry: olGeometry, type: 'advisory' });

          // Transform the projection
          const olFeatureForMap = transformFeature(
            olFeature,
            'EPSG:4326',
            projectionCode,
          );

          // feature ID to advisory ID for retrieval
          olFeatureForMap.setId(advisory.id);

          vectorSource.addFeature(olFeatureForMap);
        });
      },
    }),

    style: () => advisoryStyles.polygon,
  });
}
