import { getRegional } from '../../data/weather';
import * as helpers from '../helpers';
import * as slices from '../../../slices';

export const loadRegionalWeather = async (route, regionalWeather, filteredRegionalWeathers, regionalWeatherFilterPoints, dispatch, displayError) => {
  const routePoints = route ? route.points : null;

  // Load if filtered cams don't exist or route doesn't match
  if (!filteredRegionalWeathers || !helpers.compareRoutePoints(routePoints, regionalWeatherFilterPoints)) {
    // Fetch data if it doesn't already exist
    const regionalWeathersData = regionalWeather ? regionalWeather : await getRegional().catch((error) => displayError(error));
    
    // Filter with 20km extra tolerance
    const filteredRegionalWeathersData = helpers.filterByRoute(regionalWeathersData, route, 15000);

    dispatch(
      slices.updateRegional({
        list: regionalWeathersData,
        filteredList: filteredRegionalWeathersData,
        filterPoints: route ? route.points : null,
        timeStamp: new Date().getTime()
      })
    );
  }
};
