import { getWeather } from '../../data/weather';
import * as helpers from '../helpers';
import * as slices from '../../../slices';

export const loadCurrentWeather = async (route, currentWeather, filteredCurrentWeathers, currentWeatherFilterPoints, dispatch, displayError) => {
  const routePoints = route ? route.points : null;

  // Load if filtered cams don't exist or route doesn't match
  if (!filteredCurrentWeathers || !helpers.compareRoutePoints(routePoints, currentWeatherFilterPoints)) {
    // Fetch data if it doesn't already exist
    const currentWeathersData = currentWeather ? currentWeather : await getWeather().catch((error) => displayError(error));

    // Filter data by route
    const filteredCurrentWeathersData = route ? helpers.filterByRoute(currentWeathersData, route, 15000) : currentWeathersData;

    dispatch(
      slices.updateWeather({
        list: currentWeathersData,
        filteredList: filteredCurrentWeathersData,
        filterPoints: route ? route.points : null,
        timeStamp: new Date().getTime()
      })
    );
  }
};
