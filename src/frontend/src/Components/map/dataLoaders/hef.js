import { getHef } from '../../data/weather';

export const loadHef = async (route, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const hefData = await getHef().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: hefData, route: (route && route.routeFound ? route : null), action: 'updateHef'});
};
