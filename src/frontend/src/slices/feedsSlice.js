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
    weather: feedsInitialState
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
  },
});

export const { updateCameras, updateEvents, updateFerries, updateWeather } = feedsSlice.actions;

export default feedsSlice.reducer;
