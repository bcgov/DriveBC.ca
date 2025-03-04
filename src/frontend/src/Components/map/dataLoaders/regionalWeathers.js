import { getRegional } from '../../data/weather';

export const loadRegionalWeather = async (route, regionalWeather, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const regionalWeathersData = regionalWeather ? regionalWeather : await getRegional().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: regionalWeathersData, route: (route && route.routeFound ? route : null), action: 'updateRegional'});
};
