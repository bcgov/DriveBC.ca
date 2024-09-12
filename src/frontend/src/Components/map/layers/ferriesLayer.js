// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { ferryStyles } from '../../data/featureStyleDefinitions.js';

export function getFerriesLayer(ferriesData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  return new VectorLayer({
    classname: 'ferries',
    visible: mapContext.visible_layers.inlandFerries,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        ferriesData.forEach(ferry => {
          // Offset ~500m East to prevent overlapping with other features
          const lat = ferry.location.coordinates[0] + 0.0044;
          const lng = ferry.location.coordinates[1]
          const olGeometry = new Point([lat, lng]);
          const olFeature = new ol.Feature({ geometry: olGeometry, type: 'ferry'});

          // Transfer properties
          olFeature.setProperties(ferry);

          // Transform the projection
          const olFeatureForMap = transformFeature(
            olFeature,
            'EPSG:4326',
            projectionCode,
          );

          vectorSource.addFeature(olFeatureForMap);

          if (referenceData?.type === 'ferry') {
            // Update the reference feature if id is the reference
            if (ferry.id == referenceData.id) {
              updateReferenceFeature(olFeatureForMap);
            }
          }
        });

        setLoadingLayers(prevState => ({
          ...prevState,
          ferries: false
        }));
      },
    }),
    style: ferryStyles['static'],
  });
}
