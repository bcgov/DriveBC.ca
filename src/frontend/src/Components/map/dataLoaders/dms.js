import { getDms } from '../../data/dms';

export const loadDms = async (route, dms, dispatch, worker) => {
  // Fetch data if it doesn't already exist
  const dmsData = dms ? dms : await getDms();

  // Trigger filter worker
  worker.postMessage({data: dmsData, route: (route && route.routeFound ? route : null), action: 'updateDms'});
};
