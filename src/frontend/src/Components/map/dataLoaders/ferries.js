import { compareRoutePoints } from '../helpers/spatial';
import { getFerries } from '../../data/ferries';

export const loadFerries = async (route, ferries, filteredFerries, ferryFilterPoints, dispatch, displayError, worker) => {
  const routePoints = route ? route.points : null;

  // Load if filtered objs don't exist or route doesn't match
  if (!filteredFerries || !compareRoutePoints(routePoints, ferryFilterPoints)) {
    // Fetch data if it doesn't already exist
    const ferryData = ferries ? ferries : await getFerries().catch((error) => displayError(error));

    // Trigger filter worker
    worker.postMessage(JSON.stringify({data: ferryData, route: (route && route.routeFound ? route : null), action: 'updateFerries'}));
  }
};
