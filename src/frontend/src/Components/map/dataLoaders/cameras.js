import { getCameras } from '../../data/webcams';

export const loadCameras = async (route, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const cameras = await getCameras().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: cameras, route: (route && route.routeFound ? route : null), action: 'updateCameras'});
};
