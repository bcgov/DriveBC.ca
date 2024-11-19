// Import all helper functions for map component
import { onMoveEnd } from './advisories';
import { setEventStyle } from './events';
import { blueLocationMarkup, redLocationMarkup, redLocationToMarkup, setLocationPin } from './location';
import { calculateCenter, fitMap, removeOverlays, setZoomPan, toggleMyLocation, transformFeature, zoomIn, zoomOut } from './map';
import { compareRoutePoints, compareRouteDistance, filterByRoute, filterAdvisoryByRoute, getMidPoint, populateRouteProjection } from './spatial';

export {
  // advisories,
  onMoveEnd,
  // events
  setEventStyle,
  // location
  blueLocationMarkup, redLocationMarkup, redLocationToMarkup, setLocationPin,
  // map
  calculateCenter, fitMap, setZoomPan, toggleMyLocation, transformFeature, zoomIn, zoomOut, removeOverlays,
  // spatial
  compareRoutePoints, compareRouteDistance, filterByRoute, filterAdvisoryByRoute, getMidPoint, populateRouteProjection
};
