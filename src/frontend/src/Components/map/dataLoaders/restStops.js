import { compareRoutePoints } from '../helpers/spatial';
import { getRestStops } from '../../data/restStops';

export const loadRestStops = async (route, restStops, filteredRestStops, restStopFilterPoints, dispatch, displayError, worker) => {
  const routePoints = route ? route.points : null;

  // Load if filtered objs don't exist or route doesn't match
  if (!filteredRestStops || !compareRoutePoints(routePoints, restStopFilterPoints)) {
    // Fetch data if it doesn't already exist
    const restStopsData = restStops ? restStops : await getRestStops().catch((error) => displayError(error));

    // Trigger filter worker
    worker.postMessage({data: restStopsData, route: (route && route.routeFound ? route : null), action: 'updateRestStops'});
  }
};
