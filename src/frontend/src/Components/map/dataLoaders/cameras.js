import { getCameras } from '../../data/webcams';

export const loadCameras = async (cameras, dispatch, worker, selectedRouteRef) => {
  // Fetch data if it doesn't already exist
  const camData = cameras ? cameras : await getCameras();

  // Always read the live selected-route ref at post time (survives await)
  const routePayload = selectedRouteRef?.current?.routeFound
    ? selectedRouteRef.current
    : null;

  // Trigger filter worker
  worker.postMessage({data: camData, route: routePayload, action: 'updateCameras'});
};
