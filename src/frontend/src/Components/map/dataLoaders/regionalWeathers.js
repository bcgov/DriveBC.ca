import { getRegional } from '../../data/weather';

export const loadRegionalWeather = async (route, regionalWeather, dispatch, worker) => {
  // Fetch data if it doesn't already exist
  const regionalWeathersData = regionalWeather ? regionalWeather : await getRegional();

  // Trigger filter worker
  worker.postMessage({data: regionalWeathersData, route: (route && route.routeFound ? route : null), action: 'updateRegional'});
};
