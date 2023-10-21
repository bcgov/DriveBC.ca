import { createSlice } from '@reduxjs/toolkit';

export const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    searchLocationFrom: [],
    searchLocationTo: [],
    selectedRoute: {},
    isRouteDetailsVisible: false,
    routeEvents: [],
    routeCameras: [],
    routeDirections: [],
  },
  reducers: {
    clearSelectedRoute: (state, action) => {
      state.selectedRoute = {};
    },
    updateSelectedRoute: (state, action) => {
      state.selectedRoute = action.payload;
    },
    updateSearchLocationFrom: (state, action) => {
      state.searchLocationFrom = action.payload;
    },
    updateSearchLocationTo: (state, action) => {
      state.searchLocationTo = action.payload;
    },
    toggleIsRouteDetailsVisible: (state) => {
      state.isRouteDetailsVisible = !state.isRouteDetailsVisible;
    },
    updateRouteEvents: (state, action) => {
      state.routeEvents = action.payload;
    },
    updateRouteCameras: (state, action) => {
      state.routeCameras = action.payload;
    },
    updateRouteDirections: (state, action) => {
      state.routeDirections = action.payload;
    },
  },
});

export const { clearSelectedRoute, updateSelectedRoute, updateSearchLocationFrom, updateSearchLocationTo, toggleIsRouteDetailsVisible, updateRouteEvents, updateRouteCameras, updateRouteDirections} = routesSlice.actions;

export default routesSlice.reducer;
