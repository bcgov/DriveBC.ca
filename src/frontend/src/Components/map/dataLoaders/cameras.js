import { compareRoutePoints } from '../helpers/spatial';
import { getCameras } from '../../data/webcams';

export const loadCameras = async (route, cameras, filteredCameras, camFilterPoints, dispatch, displayError, worker) => {
  const routePoints = route ? route.points : null;

  // Load if filtered objs don't exist or route doesn't match
  if (!filteredCameras || !compareRoutePoints(routePoints, camFilterPoints)) {
    // Fetch data if it doesn't already exist
    const camData = cameras ? cameras : await getCameras().catch((error) => displayError(error));

    // Trigger filter worker
    worker.postMessage(JSON.stringify({data: camData, route: (route && route.routeFound ? route : null), action: 'updateCameras'}));
  }
};
