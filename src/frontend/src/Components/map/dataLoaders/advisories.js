import { getAdvisories } from '../../data/advisories';

export const loadAdvisories = async (route, advisories, dispatch, worker) => {
  // Fetch data if it doesn't already exist
  const advisoryData = advisories ? advisories : await getAdvisories();

  // Trigger filter worker
  worker.postMessage({data: advisoryData, route: (route && route.routeFound ? route : null), action: 'updateAdvisories'});
};
