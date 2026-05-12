import { getWeather } from '../../data/weather';

export const loadCurrentWeather = async (route, currentWeather, dispatch, worker) => {
  // Fetch data if it doesn't already exist
  const currentWeathersData = currentWeather ? currentWeather : await getWeather();

  // Trigger filter worker
  worker.postMessage({data: currentWeathersData, route: (route && route.routeFound ? route : null), action: 'updateWeather'});
};
