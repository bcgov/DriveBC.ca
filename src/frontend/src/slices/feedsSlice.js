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
    ferries: feedsInitialState
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
  },
});

export const { updateCameras, updateEvents, updateFerries } = feedsSlice.actions;

export default feedsSlice.reducer;
