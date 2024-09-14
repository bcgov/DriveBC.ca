import { compareRoutePoints } from '../helpers/spatial';
import { getRegional } from '../../data/weather';

export const loadRegionalWeather = async (route, regionalWeather, filteredRegionalWeathers, regionalWeatherFilterPoints, dispatch, displayError, worker) => {
  const routePoints = route ? route.points : null;

  // Load if filtered objs don't exist or route doesn't match
  if (!filteredRegionalWeathers || !compareRoutePoints(routePoints, regionalWeatherFilterPoints)) {
    // Fetch data if it doesn't already exist
    const regionalWeathersData = regionalWeather ? regionalWeather : await getRegional().catch((error) => displayError(error));

    // Trigger filter worker
    worker.postMessage(JSON.stringify({data: regionalWeathersData, route: (route && route.routeFound ? route : null), action: 'updateRegional'}));
  }
};
