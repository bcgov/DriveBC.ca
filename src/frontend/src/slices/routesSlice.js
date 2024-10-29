import { createSlice } from '@reduxjs/toolkit';

export const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    searchLocationFrom: [],
    searchLocationTo: [],
    selectedRoute: null,
    searchedRoutes: null,
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
  },
});

export const {
  clearSelectedRoute, updateSelectedRoute, // selected route
  updateSearchLocationFrom, updateSearchLocationTo, // search locations
  updateSearchedRoutes, updateSingleSearchedRoute, clearSearchedRoutes // searched routes
} = routesSlice.actions;

export default routesSlice.reducer;
