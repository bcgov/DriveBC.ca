import { resetFavLists, updateSelectedRoute, updateSingleSearchedRoute } from "../../slices";

export const logoutDispatch = (dispatch, selectedRoute) => {
  dispatch(resetFavLists());

  if (selectedRoute && selectedRoute.id) {
    const payload = {...selectedRoute, id: null, saved: false, label: null};
    dispatch(updateSelectedRoute(payload));
    dispatch(updateSingleSearchedRoute(payload));
  }
}
