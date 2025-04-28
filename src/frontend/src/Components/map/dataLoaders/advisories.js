import { getAdvisories } from '../../data/advisories';

export const loadAdvisories = async (route, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const advisories = await getAdvisories().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: advisories, route: (route && route.routeFound ? route : null), action: 'updateAdvisories'});
};
