import { createSlice } from '@reduxjs/toolkit';

export const camerasSlice = createSlice({
  name: 'cameras',
  initialState: {
    list: null,
    routeTimeStamp: null
  },
  reducers: {
    updateCameras: (state, action) => {
      const { list, routeTimeStamp } = action.payload;
      state.list = list;
      state.routeTimeStamp = routeTimeStamp;
    },
  },
});

export const { updateCameras } = camerasSlice.actions;

export default camerasSlice.reducer;
