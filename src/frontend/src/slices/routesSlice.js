import { createSlice } from '@reduxjs/toolkit';

export const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    searchLocationFrom: [],
    searchLocationTo: [],
    selectedRoute: {},
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
  },
});

export const { clearSelectedRoute, updateSelectedRoute, updateSearchLocationFrom, updateSearchLocationTo } = routesSlice.actions;

export default routesSlice.reducer;
