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
    updateRestStops: (state, action) => {
      state.restStops = action.payload;
    },
  },
});

export const { updateCameras, updateEvents, updateFerries, updateWeather, updateRestStops } = feedsSlice.actions;

export default feedsSlice.reducer;
