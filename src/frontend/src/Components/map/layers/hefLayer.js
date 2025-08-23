// Components and functions
import { transformFeature } from '../helpers/index.js';

// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { hefStyles } from '../../data/featureStyleDefinitions.js';

export function getHefLayer(
  forecasts,
  projectionCode,
  mapContext,
  referenceData,
  updateReferenceFeature,
  setLoadingLayers
) {
  const vectorSource = new VectorSource();

  forecasts.forEach(forecast => {
    // if there's no coordinates or no actual forecasts
    if (!forecast.location || (forecast.forecasts || []).length === 0) {
      return;
    }

    const lng = forecast.location.coordinates[0];
    const lat = forecast.location.coordinates[1];
    const olGeometry = new Point([lng, lat]);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'hef' });

    // Transfer properties
    olFeature.setProperties(forecast)

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );

    // feature ID to station ID for retrieval
    olFeatureForMap.setId(forecast.id);

    vectorSource.addFeature(olFeatureForMap);

    if (referenceData?.type === 'hef') {
      // Update the reference feature if id is the reference
      if (forecast.id == referenceData.id) {  // Intentional loose equality for string IDs
        updateReferenceFeature(olFeatureForMap);
      }
    }
  });

  return new VectorLayer({
    classname: 'hef',
    visible: mapContext.visible_layers.weather,
    source: vectorSource,
    style: () => null
  });
}

export function updateHefLayer(weathers, layer, setLoadingLayers) {
  const weathersDict = weathers.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const weatherFeature of layer.getSource().getFeatures()) {
    if(!weatherFeature.getProperties()['clicked']){
      weatherFeature.setStyle(weathersDict[weatherFeature.getId()] ? hefStyles['static'] : new Style(null));
    }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    weathers: false
  }));
}
