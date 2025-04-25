import { getWeather } from '../../data/weather';

export const loadCurrentWeather = async (route, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const currentWeather = await getWeather().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: currentWeather, route: (route && route.routeFound ? route : null), action: 'updateWeather'});
};
