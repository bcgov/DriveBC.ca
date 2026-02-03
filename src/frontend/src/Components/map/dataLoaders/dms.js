import { getDms } from '../../data/dms';

export const loadDms = async (route, dms, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const dmsData = dms ? dms : await getDms().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: dmsData, route: (route && route.routeFound ? route : null), action: 'updateDms'});
};
