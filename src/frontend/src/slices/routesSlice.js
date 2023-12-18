import { createSlice } from '@reduxjs/toolkit';

export const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    searchLocationFrom: [],
    searchLocationTo: [],
    selectedRoute: {},
    isEventClicked: false,
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
      state.isEventClicked = false;
    },
    updateSearchLocationTo: (state, action) => {
      state.searchLocationTo = action.payload;
      state.isEventClicked = false;
    },
    setIsEventClicked: (state, action) => {
      state.isEventClicked = action.payload;
    },
  },
});

export const { clearSelectedRoute, updateSelectedRoute, updateSearchLocationFrom, updateSearchLocationTo, setIsEventClicked } = routesSlice.actions;

export default routesSlice.reducer;
