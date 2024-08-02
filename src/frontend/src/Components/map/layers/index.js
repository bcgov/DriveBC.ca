import { getAdvisoriesLayer } from './advisoriesLayer.js';
import { getCamerasLayer } from './camerasLayer.js';
import { getCurrentWeatherLayer } from './currentWeatherLayer.js';
import { getFerriesLayer } from './ferriesLayer.js';
import { getRegionalWeatherLayer } from './regionalWeatherLayer.js';
import { getRestStopsLayer } from './restStopsLayer.js';
import { getLargeRestStopsLayer } from './largeRestStopsLayer.js';
import { getRouteLayer } from './routeLayer.js';
import { loadEventsLayers } from './eventsLayer.js';

const layerFuncMap = {
  advisoriesLayer: getAdvisoriesLayer,
  highwayCams: getCamerasLayer,
  weather: getCurrentWeatherLayer,
  inlandFerries: getFerriesLayer,
  regional: getRegionalWeatherLayer,
  restStops: getRestStopsLayer,
  largeRestStops: getLargeRestStopsLayer,
  routeLayer: getRouteLayer,
}

export const loadLayer = (mapLayers, mapRef, mapContext, key, dataList, zIndex, referenceData, updateReferenceFeature, setLoadingLayers) => {
  // Remove layer if it already exists
  if (mapLayers.current[key]) {
    mapRef.current.removeLayer(mapLayers.current[key]);
  }

  // Add layer if array exists
  if (dataList) {
    // Generate and add layer
    mapLayers.current[key] = layerFuncMap[key](
      dataList,
      mapRef.current.getView().getProjection().getCode(),
      mapContext,
      referenceData,
      updateReferenceFeature,
      setLoadingLayers
    );

    mapRef.current.addLayer(mapLayers.current[key]);
    mapLayers.current[key].setZIndex(zIndex);
  }
}

export const enableReferencedLayer = (referenceData, mapContext) => {
  // Do nothing if no reference data
  if (!referenceData) return;

  const featureType = referenceData.type;

  // Enable layers based on reference feature type
  if (featureType === 'camera') {
    mapContext.visible_layers['highwayCams'] = true;

  } else if (featureType === 'ferry') {
    mapContext.visible_layers['inlandFerries'] = true;

  } else if (featureType === 'regionalWeather' || featureType === 'localWeather') {
    mapContext.visible_layers['weather'] = true;
    mapContext.visible_layers['regional'] = true;

  } else if (featureType === 'restStop') {
    mapContext.visible_layers['restStops'] = true;
    mapContext.visible_layers['largeRestStops'] = false;

  } else if (featureType === 'largeRestStop') {
    // Only show large rest stops if both rest stops layers are not visible
    if (!mapContext.visible_layers['restStops'] && !mapContext.visible_layers['largeRestStops']) {
      mapContext.visible_layers['restStops'] = false;
      mapContext.visible_layers['largeRestStops'] = true;
    }

  } else {
    const featureDisplayCategory = referenceData.display_category;
    switch (featureDisplayCategory) {
      case 'closures':
        mapContext.visible_layers['closures'] = true;
        mapContext.visible_layers['closuresLines'] = true;
        break;
      case 'majorEvents':
        mapContext.visible_layers['majorEvents'] = true;
        mapContext.visible_layers['majorEventsLines'] = true;
        break;
      case 'minorEvents':
        mapContext.visible_layers['minorEvents'] = true;
        mapContext.visible_layers['minorEventsLines'] = true;
        break;
      case 'futureEvents':
        mapContext.visible_layers['futureEvents'] = true;
        mapContext.visible_layers['futureEventsLines'] = true;
        break;
    }
  }
}

export { loadEventsLayers };
