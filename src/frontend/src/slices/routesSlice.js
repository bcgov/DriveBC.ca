import { createSlice } from '@reduxjs/toolkit';

export const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    searchLocationFrom: [],
    searchLocationTo: [],
    selectedRoute: {},
    isRouteDetailsVisible: false,
    testEvents: [],
    testCameras: [],
    testDirections: [],
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
    updateTestEvents: (state, action) => {
      state.testEvents = action.payload;
    },
    updateTestCameras: (state, action) => {
      state.testCameras = action.payload;
    },
    updateTestDirections: (state, action) => {
      state.testDirections = action.payload;
    },
  },
});

export const { clearSelectedRoute, updateSelectedRoute, updateSearchLocationFrom, updateSearchLocationTo, toggleIsRouteDetailsVisible, updateTestEvents, updateTestCameras, updateTestDirections} = routesSlice.actions;

export default routesSlice.reducer;
