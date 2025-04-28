import { getRestStops } from '../../data/restStops';

export const loadRestStops = async (route, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const restStops = await getRestStops().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: restStops, route: (route && route.routeFound ? route : null), action: 'updateRestStops'});
};
