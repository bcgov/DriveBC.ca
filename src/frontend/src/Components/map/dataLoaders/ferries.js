import { getFerries } from '../../data/ferries';
import * as helpers from '../helpers';
import * as slices from '../../../slices';

export const loadFerries = async (route, ferries, filteredFerries, ferryFilterPoints, dispatch, displayError) => {
  const routePoints = route ? route.points : null;

  // Load if filtered cams don't exist or route doesn't match
  if (!filteredFerries || !helpers.compareRoutePoints(routePoints, ferryFilterPoints)) {
    // Fetch data if it doesn't already exist
    const ferryData = ferries ? ferries : await getFerries().catch((error) => displayError(error));

    // Filter data by route
    const filteredFerryData = route ? helpers.filterByRoute(ferryData, route) : ferryData;

    dispatch(
      slices.updateFerries({
        list: ferryData,
        filteredList: filteredFerryData,
        filterPoints: route ? route.points : null,
        timeStamp: new Date().getTime()
      })
    );
  }
};
