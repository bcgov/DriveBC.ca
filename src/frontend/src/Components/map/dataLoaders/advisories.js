import { getAdvisories } from '../../data/advisories';

export const loadAdvisories = async (route, advisories, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const advisoryData = advisories ? advisories : await getAdvisories().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: advisoryData, route: (route && route.routeFound ? route : null), action: 'updateAdvisories'});
};
