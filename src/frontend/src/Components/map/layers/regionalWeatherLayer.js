// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { regionalStyles } from '../../data/featureStyleDefinitions.js';

export function getRegionalWeatherLayer(weatherData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  return new VectorLayer({
    classname: 'regional',
    visible: mapContext.visible_layers.weather,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        weatherData.forEach(weather => {
          if (!weather.location) {
            return;
          }

          // Offset ~500m East to prevent overlapping with other features
          const lng = weather.location.coordinates[0] + 0.0044;
          const lat = weather.location.coordinates[1];
          const olGeometry = new Point([lng, lat]);
          const olFeature = new ol.Feature({ geometry: olGeometry, type: 'regionalWeather' });

          // Transfer properties
          olFeature.setProperties(weather)

          // Transform the projection
          const olFeatureForMap = transformFeature(
            olFeature,
            'EPSG:4326',
            projectionCode,
          );

          vectorSource.addFeature(olFeatureForMap);

          if (referenceData?.type === 'regionalWeather') {
            // Update the reference feature if id is the reference
            if (weather.id == referenceData.id) {
              updateReferenceFeature(olFeatureForMap);
            }
          }
        });

        setLoadingLayers(prevState => ({
          ...prevState,
          weathers: false
        }));
      },
    }),
    style: regionalStyles['static'],
  });
}
