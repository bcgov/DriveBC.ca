import { getCameras } from '../../data/webcams';

export const loadCameras = async (route, cameras, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const camData = cameras ? cameras : await getCameras().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: camData, route: (route && route.routeFound ? route : null), action: 'updateCameras'});
};
