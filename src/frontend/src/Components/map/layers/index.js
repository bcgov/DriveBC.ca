import { getAdvisoriesLayer } from './advisoriesLayer.js';
import { getCamerasLayer } from './camerasLayer.js';
import { getCurrentWeatherLayer } from './currentWeatherLayer.js';
import { getFerriesLayer } from './ferriesLayer.js';
import { getRegionalWeatherLayer } from './regionalWeatherLayer.js';
import { getRestStopsLayer } from './restStopsLayer.js';
import { getRouteLayer } from './routeLayer.js';
import { loadEventsLayers } from './eventsLayer.js';

const layerFuncMap = {
  advisoriesLayer: getAdvisoriesLayer,
  highwayCams: getCamerasLayer,
  weather: getCurrentWeatherLayer,
  inlandFerries: getFerriesLayer,
  regional: getRegionalWeatherLayer,
  restStops: getRestStopsLayer,
  routeLayer: getRouteLayer,
}

export const loadLayer = (mapLayers, mapRef, mapContext, key, dataList, zIndex, referenceData, updateReferenceFeature) => {
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
      updateReferenceFeature
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

  // reference features can only be cams or events
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
