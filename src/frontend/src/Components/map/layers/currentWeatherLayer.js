// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { roadWeatherStyles } from '../../data/featureStyleDefinitions.js';

export function getCurrentWeatherLayer(weatherData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  const vectorSource = new VectorSource();

  weatherData.forEach(weather => {
    if (!weather.location) {
      return
    }

    // Offset ~500m East to prevent overlapping with other features
    const lng = weather.location.coordinates[0] + 0.0044;
    const lat = weather.location.coordinates[1]
    const olGeometry = new Point([lng, lat]);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'currentWeather' });

    // Transfer properties
    olFeature.setProperties(weather)

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );

    // feature ID to station ID for retrieval
    olFeatureForMap.setId(weather.id);

    vectorSource.addFeature(olFeatureForMap);

    if (referenceData?.type === 'localWeather') {
      // Update the reference feature if id is the reference
      if (weather.id == referenceData.id) {
        updateReferenceFeature(olFeatureForMap);
      }
    }
  });

  return new VectorLayer({
    classname: 'weather',
    visible: mapContext.visible_layers.weather,
    source: vectorSource,
    style: () => null
  });
}

export function updateCurrentWeatherLayer(weathers, layer, setLoadingLayers) {
  const weathersDict = weathers.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const weatherFeature of layer.getSource().getFeatures()) {
    if(weatherFeature.getStyle() !== roadWeatherStyles['active']){
      weatherFeature.setStyle(weathersDict[weatherFeature.getId()] ? roadWeatherStyles['static'] : new Style(null));
    }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    weathers: false
  }));
}
