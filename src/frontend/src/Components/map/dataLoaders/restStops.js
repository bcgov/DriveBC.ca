import { getRestStops } from '../../data/restStops';
import * as helpers from '../helpers';
import * as slices from '../../../slices';

export const loadRestStops = async (route, restStops, filteredRestStops, restStopFilterPoints, dispatch, displayError) => {
  const routePoints = route ? route.points : null;

  // Load if filtered cams don't exist or route doesn't match
  if (!filteredRestStops || !helpers.compareRoutePoints(routePoints, restStopFilterPoints)) {
    // Fetch data if it doesn't already exist
    const restStopsData = restStops ? restStops : await getRestStops().catch((error) => displayError(error));

    // Filter data by route
    const filteredRestStopsData = route ? helpers.filterByRoute(restStopsData, route) : restStopsData;

    dispatch(
      slices.updateRestStops({
        list: restStopsData,
        filteredList: filteredRestStopsData,
        filterPoints: route ? route.points : null,
        timeStamp: new Date().getTime()
      })
    );
  }
};
