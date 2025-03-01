import { getHef } from '../../data/weather';

export const loadHef = async (route, hef, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const hefData = hef ? hef : await getHef().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: hefData, route: (route && route.routeFound ? route : null), action: 'updateHef'});
};
