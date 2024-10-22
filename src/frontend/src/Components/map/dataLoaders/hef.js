import { compareRoutePoints } from '../helpers/spatial';
import { getHef } from '../../data/weather';

export const loadHef = async (route, hef, filteredHef, hefFilterPoints, dispatch, displayError, worker) => {
  const routePoints = route ? route.points : null;

  // Load if filtered objs don't exist or route doesn't match
  if (!filteredHef || !compareRoutePoints(routePoints, hefFilterPoints)) {
    // Fetch data if it doesn't already exist
    const hefData = hef ? hef : await getHef().catch((error) => displayError(error));

    // Trigger filter worker
    worker.postMessage({data: hefData, route: (route && route.routeFound ? route : null), action: 'updateHef'});
  }
};
