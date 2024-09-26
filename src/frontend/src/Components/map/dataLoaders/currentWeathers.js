import { compareRoutePoints } from '../helpers/spatial';
import { getWeather } from '../../data/weather';

export const loadCurrentWeather = async (route, currentWeather, filteredCurrentWeathers, currentWeatherFilterPoints, dispatch, displayError, worker) => {
  const routePoints = route ? route.points : null;

  // Load if filtered objs don't exist or route doesn't match
  if (!filteredCurrentWeathers || !compareRoutePoints(routePoints, currentWeatherFilterPoints)) {
    // Fetch data if it doesn't already exist
    const currentWeathersData = currentWeather ? currentWeather : await getWeather().catch((error) => displayError(error));

    // Trigger filter worker
    worker.postMessage({data: currentWeathersData, route: (route && route.routeFound ? route : null), action: 'updateWeather'});
  }
};
