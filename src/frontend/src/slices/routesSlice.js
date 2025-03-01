import { createSlice } from '@reduxjs/toolkit';

export const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    searchLocationFrom: [],
    searchLocationTo: [],
    selectedRoute: null,
    searchedRoutes: null,
    routeDistance: null, // for matching route distance from email notification
  },
  reducers: {
    clearSelectedRoute: (state, action) => {
      state.selectedRoute = null;
    },
    updateSelectedRoute: (state, action) => {
      state.selectedRoute = action.payload;
    },
    clearSearchedRoutes: (state, action) => {
      state.searchedRoutes = null;
    },
    updateSearchedRoutes: (state, action) => {
      state.searchedRoutes = action.payload;
    },
    updateSingleSearchedRoute: (state, action) => {
      if (!state.searchedRoutes) return;

      const index = state.searchedRoutes.findIndex(route => route.searchTimestamp === action.payload.searchTimestamp);
      if (index !== -1) {
        state.searchedRoutes[index] = action.payload;
      }
    },
    updateSearchLocationFrom: (state, action) => {
      state.searchLocationFrom = action.payload;
    },
    updateSearchLocationTo: (state, action) => {
      state.searchLocationTo = action.payload;
    },
    updateSearchLocationFromWithMyLocation: (state, action) => {
      // Only update if no location is set or if the location is "Current location"
      if (!state.searchLocationFrom.length || state.searchLocationFrom[0].label === "Current location")
        state.searchLocationFrom = action.payload;
    },
    clearRouteDistance: (state, action) => {
      state.routeDistance = null;
    },
    updateRouteDistance: (state, action) => {
      state.routeDistance = action.payload;
    },
  },
});

export const {
  clearSelectedRoute, updateSelectedRoute, // selected route
  updateSearchLocationFrom, updateSearchLocationTo, updateSearchLocationFromWithMyLocation, // search locations
  updateSearchedRoutes, updateSingleSearchedRoute, clearSearchedRoutes, // searched routes
  updateRouteDistance, clearRouteDistance
} = routesSlice.actions;

export default routesSlice.reducer;
