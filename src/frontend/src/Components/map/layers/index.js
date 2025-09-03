import { getAdvisoriesLayer, updateAdvisoriesLayer } from './advisoriesLayer.js';
import { getCamerasLayer, updateCamerasLayer } from './camerasLayer.js';
import { getCurrentWeatherLayer, updateCurrentWeatherLayer } from './currentWeatherLayer.js';
import { loadEventsLayers, updateEventsLayers } from './eventsLayer.js';
import { getFerriesLayer, updateFerriesLayer } from './ferriesLayer.js';
import { getRegionalWeatherLayer, updateRegionalWeatherLayer } from './regionalWeatherLayer.js';
import { getHefLayer, updateHefLayer } from './hefLayer.js';
import { getRestStopsLayer, updateRestStopsLayer } from './restStopsLayer.js';
import { getLargeRestStopsLayer, updateLargeRestStopsLayer } from './largeRestStopsLayer.js';
import { getRouteLayer } from './routeLayer.js';
import { getBorderCrossingsLayer, updateBorderCrossingsLayer } from "./borderCrossingsLayer";
import { getWildfiresLayer, updateWildfiresLayer } from "./wildfiresLayer";

const layerFuncMap = {
  advisoriesLayer: getAdvisoriesLayer,
  highwayCams: getCamerasLayer,
  weather: getCurrentWeatherLayer,
  inlandFerries: getFerriesLayer,
  regional: getRegionalWeatherLayer,
  hef: getHefLayer,
  restStops: getRestStopsLayer,
  largeRestStops: getLargeRestStopsLayer,
  routeLayer: getRouteLayer,
  borderCrossings: getBorderCrossingsLayer,
  wildfires: getWildfiresLayer
}

const layerUpdateFuncMap = {
  advisoriesLayer: updateAdvisoriesLayer,
  highwayCams: updateCamerasLayer,
  inlandFerries: updateFerriesLayer,
  weather: updateCurrentWeatherLayer,
  regional: updateRegionalWeatherLayer,
  hef: updateHefLayer,
  restStops: updateRestStopsLayer,
  largeRestStops: updateLargeRestStopsLayer,
  borderCrossings: updateBorderCrossingsLayer,
  wildfires: updateWildfiresLayer
}

export const loadLayer = (mapLayers, mapRef, mapContext, key, dataList, filteredDataList, zIndex, referenceData, updateReferenceFeature, setLoadingLayers) => {
  // Always remove and regenerate route layer
  if (key == 'routeLayer') {
    mapRef.current.removeLayer(mapLayers.current[key]);
  }

  if (dataList) {
    if (!mapLayers.current[key] || key == 'routeLayer') {
      // Generate and add layer if it doesn't exist
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

    // Toggle features' styles based on dataList
    if (key != 'routeLayer') {
      return layerUpdateFuncMap[key](filteredDataList, mapLayers.current[key], setLoadingLayers);
    }
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

  } else if (featureType === 'regionalWeather' || featureType === 'localWeather' || featureType === 'hef') {
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

  } else if (featureType === 'wildfire') {
    mapContext.visible_layers['wildfires'] = true;

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
      case 'chainUps':
        mapContext.visible_layers['chainUps'] = true;
        mapContext.visible_layers['chainUpsLines'] = true;
        break;
      case 'roadConditions':
        mapContext.visible_layers['roadConditions'] = true;
        mapContext.visible_layers['roadConditionsLines'] = true;
        break;
    }
  }
}

export { loadEventsLayers, updateEventsLayers };
