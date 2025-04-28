import { getRegional } from '../../data/weather';

export const loadRegionalWeather = async (route, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const regionalWeather = await getRegional().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: regionalWeather, route: (route && route.routeFound ? route : null), action: 'updateRegional'});
};
