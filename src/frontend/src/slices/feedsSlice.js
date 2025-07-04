import { createSlice } from '@reduxjs/toolkit';

export const feedsInitialState = {
  list: null,
  filteredList: null,
}

export const feedsSlice = createSlice({
  name: 'feeds',
  initialState: {
    cameras: feedsInitialState,
    events: feedsInitialState,
    ferries: feedsInitialState,
    weather: feedsInitialState,
    regional: feedsInitialState,
    hef: feedsInitialState,
    restStops: feedsInitialState,
    borderCrossings: feedsInitialState,
    areas: feedsInitialState,
    wildfires: feedsInitialState,
  },
  reducers: {
    updateCameras: (state, action) => {
      state.cameras = action.payload;
    },
    updateEvents: (state, action) => {
      state.events = action.payload;
    },
    updateFerries: (state, action) => {
      state.ferries = action.payload;
    },
    updateWeather: (state, action) => {
      state.weather = action.payload;
    },
    updateRegional: (state, action) => {
      state.regional = action.payload;
    },
    updateHef: (state, action) => {
      state.hef = action.payload;
    },
    updateRestStops: (state, action) => {
      state.restStops = action.payload;
    },
    updateBorderCrossings: (state, action) => {
      state.borderCrossings = action.payload;
    },
    updateAreas: (state, action) => {
      state.areas = action.payload;
    },
    updateWildfires: (state, action) => {
      state.wildfires = action.payload;
    },
  },
});

export const {
  updateCameras,
  updateEvents,
  updateFerries,
  updateWeather,
  updateRegional,
  updateHef,
  updateRestStops,
  updateBorderCrossings,
  updateAreas,
  updateWildfires
} = feedsSlice.actions;

export default feedsSlice.reducer;
