import { getCameras } from '../../data/webcams';
import * as helpers from '../helpers';
import * as slices from '../../../slices';

export const loadCameras = async (route, cameras, filteredCameras, camFilterPoints, dispatch, displayError) => {
  const routePoints = route ? route.points : null;

  // Load if filtered cams don't exist or route doesn't match
  if (!filteredCameras || !helpers.compareRoutePoints(routePoints, camFilterPoints)) {
    // Fetch data if it doesn't already exist
    const camData = cameras ? cameras : await getCameras().catch((error) => displayError(error));

    // Filter data by route
    const filteredCamData = route ? helpers.filterByRoute(camData, route, null, true) : camData;

    dispatch(
      slices.updateCameras({
        list: camData,
        filteredList: filteredCamData,
        filterPoints: route ? route.points : null,
        timeStamp: new Date().getTime()
      })
    );
  }
};
