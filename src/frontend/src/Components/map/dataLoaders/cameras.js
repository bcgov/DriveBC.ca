import { getCameras } from '../../data/webcams';

export const loadCameras = async (route, cameras, dispatch, worker) => {
  // Fetch data if it doesn't already exist
  const camData = cameras ? cameras : await getCameras();

  // Trigger filter worker
  worker.postMessage({data: camData, route: (route && route.routeFound ? route : null), action: 'updateCameras'});
};
