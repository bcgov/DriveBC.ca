import { getRestStops } from '../../data/restStops';

export const loadRestStops = async (route, restStops, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const restStopsData = restStops ? restStops : await getRestStops().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: restStopsData, route: (route && route.routeFound ? route : null), action: 'updateRestStops'});
};
