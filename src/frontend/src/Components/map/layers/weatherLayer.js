// Components and functions
import { transformFeature } from '../helper.js';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { roadWeatherStyles } from '../../data/featureStyleDefinitions.js';

export function loadWeatherLayers(weatherData, mapContext, projectionCode) {
  return new VectorLayer({
    classname: 'weather',
    visible: mapContext.visible_layers.weather,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        weatherData.forEach(weather => {
          // Build a new OpenLayers feature
          if(!weather.location){
            return
          }
          const lat = weather.location.coordinates[0];
          const lng = weather.location.coordinates[1]
          const olGeometry = new Point([lng, lat]);
          const olFeature = new ol.Feature({ geometry: olGeometry });

          // Transfer properties
          olFeature.setProperties(weather)
          olFeature.set('type', 'weather');

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
    style: roadWeatherStyles['static'],
  });
}
