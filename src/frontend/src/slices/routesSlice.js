import { createSlice } from '@reduxjs/toolkit';

export const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    searchLocationFrom: [],
    searchLocationTo: [],
    selectedRoute: null,
    alternateRoute: null,
    fastestRoute: null,
    shortestRoute: null,
  },
  reducers: {
    clearSelectedRoute: (state, action) => {
      state.selectedRoute = null;
    },
    clearAlternateRoute: (state, action) => {
      state.alternateRoute = null;
    },
    updateSelectedRoute: (state, action) => {
      state.selectedRoute = action.payload;
    },
    updateAlternateRoute: (state, action) => {
      state.alternateRoute = action.payload;
    },
    updateFastestRoute: (state, action) => {
      state.fastestRoute = action.payload;
    },
    updateShortestRoute: (state, action) => {
      state.shortestRoute = action.payload;
    },
    updateSearchLocationFrom: (state, action) => {
      state.searchLocationFrom = action.payload;
    },
    updateSearchLocationTo: (state, action) => {
      state.searchLocationTo = action.payload;
    },
    // New swapRoutes reducer to swap selectedRoute and alternateRoute
    swapRoutesToFastest: (state) => {
      state.selectedRoute = state.fastestRoute;
      state.alternateRoute = state.shortestRoute;
    },
    swapRoutesToShortest: (state) => {
      state.selectedRoute = state.shortestRoute;
      state.alternateRoute = state.fastestRoute;
    },
  },
});

export const { clearSelectedRoute, clearAlternateRoute, updateSelectedRoute, updateAlternateRoute, updateFastestRoute, updateShortestRoute, updateSearchLocationFrom, updateSearchLocationTo, swapRoutesToFastest, swapRoutesToShortest } = routesSlice.actions;

export default routesSlice.reducer;
