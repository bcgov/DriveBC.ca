import { updateAdvisories, updateBulletins } from './cmsSlice';
import {
  updateCameras,
  updateEvents,
  updateFerries,
  updateRegional,
  updateHef,
  updateRestStops,
  updateWeather,
  updateBorderCrossings,
  updateAreas,
  updateWildfires
} from './feedsSlice';
import { updateMapState } from './mapSlice';
import {
  clearSelectedRoute, updateSelectedRoute, // selected route
  updateSearchLocationFrom, updateSearchLocationTo, updateSearchLocationFromWithMyLocation, // search locations
  updateSearchedRoutes, updateSingleSearchedRoute, clearSearchedRoutes, // searched routes
  updateRouteDistance, clearRouteDistance, // route distance
  updateShowRouteObjs // show route objects
} from './routesSlice';
import {
  resetFavLists, // General
  updateFavCams, pushFavCam, removeFavCam, // Cams
  updateFavRoutes, pushFavRoute, removeFavRoute, updateSingleFavRoute, // Routes
  updatePendingAction, resetPendingAction // Pending action
} from './userSlice';

export {
  // cmsSlice
  updateAdvisories,
  updateBulletins,

  // feedsSlice
  updateCameras,
  updateEvents,
  updateFerries,
  updateWeather,
  updateRegional,
  updateHef,
  updateRestStops,
  updateBorderCrossings,
  updateAreas,
  updateWildfires,

  // mapSlice
  updateMapState,

  // routesSlice
  clearSelectedRoute, updateSelectedRoute, // selected route
  updateSearchLocationFrom, updateSearchLocationTo, updateSearchLocationFromWithMyLocation, // search locations
  updateSearchedRoutes, updateSingleSearchedRoute, clearSearchedRoutes, // searched routes
  updateRouteDistance, clearRouteDistance, // route distance
  updateShowRouteObjs, // show route objects

  // userSlice
  resetFavLists, // General
  updateFavCams, pushFavCam, removeFavCam, // Cams
  updateFavRoutes, pushFavRoute, removeFavRoute, updateSingleFavRoute, // Routes
  updatePendingAction, resetPendingAction // Pending action
};
