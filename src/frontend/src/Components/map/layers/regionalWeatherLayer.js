// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { regionalStyles, regionalWarningStyles } from '../../data/featureStyleDefinitions.js';

export function getRegionalWeatherLayer(weatherData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  const vectorSource = new VectorSource();

  weatherData.forEach(weather => {
    if (!weather.location) {
      return;
    }

    const lng = weather.location.coordinates[0];
    const lat = weather.location.coordinates[1];
    const olGeometry = new Point([lng, lat]);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'regionalWeather' });

    // Transfer properties
    olFeature.setProperties(weather);

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );

    // feature ID to station ID for retrieval
    olFeatureForMap.setId(weather.id);

    vectorSource.addFeature(olFeatureForMap);

    if (referenceData?.type === 'regionalWeather') {
      // Update the reference feature if id is the reference
      if (weather.id == referenceData.id) {  // Intentional loose equality for string IDs
        updateReferenceFeature(olFeatureForMap);
      }
    }
  });

  return new VectorLayer({
    classname: 'regional',
    visible: mapContext.visible_layers.weather,
    source: vectorSource,
    style: () => null
  });
}

export function updateRegionalWeatherLayer(weathers, layer, setLoadingLayers) {
  const weathersDict = weathers.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const weatherFeature of layer.getSource().getFeatures()) {
    if (!weatherFeature.getProperties()['clicked']) {
      if (weathersDict[weatherFeature.getId()]) {
        const warnings = weatherFeature.get('warnings');
        const weatherStyle = warnings ? regionalWarningStyles['static'] : regionalStyles['static'];
        weatherFeature.setStyle(weatherStyle);

      } else {
        weatherFeature.setStyle(new Style(null));
      }
    }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    weathers: false
  }));
}
