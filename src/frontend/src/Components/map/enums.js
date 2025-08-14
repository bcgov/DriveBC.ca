export const CLOSURE_LAYER = 'closures';
export const MAJOR_EVENTS_LAYER = 'majorEvents';
export const MINOR_EVENTS_LAYER = 'minorEvents';
export const FUTURE_EVENTS_LAYER = 'futureEvents';
export const CAMERAS_LAYER = 'highwayCams';
export const ROAD_CONDITIONS_LAYER = 'roadConditions';
export const INLAND_FERRIES_LAYER = 'inlandFerries';
export const WEATHER_LAYER = 'weather';
export const WILDFIRES_LAYER = 'wildfires';
export const REST_STOPS_LAYER = 'restStops';
export const CHAIN_UPS_LAYER = 'chainUps';
export const LARGE_REST_STOPS_LAYER = 'largeRestStops';

export const toggleableLayers = [
  CLOSURE_LAYER,
  MAJOR_EVENTS_LAYER,
  MINOR_EVENTS_LAYER,
  FUTURE_EVENTS_LAYER,
  CAMERAS_LAYER,
  ROAD_CONDITIONS_LAYER,
  INLAND_FERRIES_LAYER,
  WEATHER_LAYER,
  WILDFIRES_LAYER,
  REST_STOPS_LAYER,
  CHAIN_UPS_LAYER,
  LARGE_REST_STOPS_LAYER
];

export const layerNameMap = {
  camera: CAMERAS_LAYER,
  ferry: INLAND_FERRIES_LAYER,
  currentWeather: WEATHER_LAYER,
  regionalWeather: WEATHER_LAYER,
  hef: WEATHER_LAYER,
  wildfire: WILDFIRES_LAYER,
  restStop: REST_STOPS_LAYER,
  largeRestStop: LARGE_REST_STOPS_LAYER
};
