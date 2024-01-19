import { createSlice } from '@reduxjs/toolkit';

export const camerasInitialState = {
  data: {
    list: null,
    routeTimeStamp: null,
    camerasExpires: null,
  }
}

export const camerasSlice = createSlice({
  name: 'cameras',
  initialState: camerasInitialState,
  reducers: {
    updateCameras: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { updateCameras } = camerasSlice.actions;

export default camerasSlice.reducer;
