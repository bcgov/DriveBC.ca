import { compareRoutePoints } from '../helpers/spatial';
import { getAdvisories } from '../../data/advisories';

export const loadAdvisories = async (route, advisories, filteredAdvisories, advisoryFilterPoints, dispatch, displayError, worker) => {
  const routePoints = route ? route.points : null;

  // Load if filtered objs don't exist or route doesn't match
  if (!filteredAdvisories || !compareRoutePoints(routePoints, advisoryFilterPoints)) {
    // Fetch data if it doesn't already exist
    const advisoryData = advisories ? advisories : await getAdvisories().catch((error) => displayError(error));

    // Trigger filter worker
    worker.postMessage(JSON.stringify({data: advisoryData, route: (route && route.routeFound ? route : null), action: 'updateAdvisories'}));
  }
};
