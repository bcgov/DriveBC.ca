import { getWildfires } from '../../data/wildfires';

export const loadWildfires = async (route, wildfires, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const wildfiresData = wildfires ? wildfires : await getWildfires().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: wildfiresData, route: (route && route.routeFound ? route : null), action: 'updateWildfires'});
};
