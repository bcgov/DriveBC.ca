import { resetFavLists, updateSelectedRoute, updateSingleSearchedRoute } from "../../slices";

export const logoutDispatch = (dispatch, selectedRoute, searchedRoutes) => {
  dispatch(resetFavLists());

  if (selectedRoute && selectedRoute.id) {
    const payload = {...selectedRoute, id: null, saved: false, label: null};
    dispatch(updateSelectedRoute(payload));
  }

  if (searchedRoutes && searchedRoutes.length) {
    searchedRoutes.forEach((route) => {
      // If route is not saved, don't update
      if (!route.id) return;

      const payload = {...route, id: null, saved: false, label: null};
      dispatch(updateSingleSearchedRoute(payload));
    });
  }
}
