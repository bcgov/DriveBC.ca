import { getAdvisories } from '../../data/advisories';
import * as slices from '../../../slices';
import * as helpers from '../helpers';

export const loadAdvisories = async (route, advisories, filteredAdvisories, advisoryFilterPoints, dispatch, displayError) => {
  const routePoints = route ? route.points : null;

  // Load if filtered advisories don't exist or route doesn't match
  if (!filteredAdvisories || !helpers.compareRoutePoints(routePoints, advisoryFilterPoints)) {
    // Fetch data if it doesn't already exist
    const advisoryData = advisories ? advisories : await getAdvisories().catch((error) => displayError(error));

    // Filter data by route
    const filteredAdvisoryData = route ? helpers.filterAdvisoryByRoute(advisoryData, route, null, true) : advisoryData;

    dispatch(
      slices.updateAdvisories({
        list: await getAdvisories().catch((error) => displayError(error)),
        filteredList: filteredAdvisoryData,
        filterPoints: route ? route.points : null,
        timeStamp: new Date().getTime(),
      }),
    );
  }
};
