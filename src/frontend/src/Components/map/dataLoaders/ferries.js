import { getFerries } from '../../data/ferries';

export const loadFerries = async (route, ferries, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const ferryData = ferries ? ferries : await getFerries().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: ferryData, route: (route && route.routeFound ? route : null), action: 'updateFerries'});
};
