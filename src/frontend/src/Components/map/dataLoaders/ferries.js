import { getFerries } from '../../data/ferries';

export const loadFerries = async (route, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const ferries = await getFerries().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: ferries, route: (route && route.routeFound ? route : null), action: 'updateFerries'});
};
