import { createSlice } from '@reduxjs/toolkit';

export const feedsInitialState = {
  list: null,
  routeTimeStamp: null,
  timeStamp: null,
}

export const feedsSlice = createSlice({
  name: 'feeds',
  initialState: {
    cameras: feedsInitialState,
    events: feedsInitialState,
    ferries: feedsInitialState,
    weather: feedsInitialState,
    regional: feedsInitialState,
    restStops: feedsInitialState,
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
    updateRestStops: (state, action) => {
      state.restStops = action.payload;
    },
  },
});

export const {
  updateCameras,
  updateEvents,
  updateFerries,
  updateWeather,
  updateRegional,
  updateRestStops,
} = feedsSlice.actions;

export default feedsSlice.reducer;
