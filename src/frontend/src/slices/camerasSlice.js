import { createSlice } from '@reduxjs/toolkit';

export const camerasSlice = createSlice({
  name: 'cameras',
  initialState: {
    cameras: {},
  },
  reducers: {
    updateCameras: (state, action) => {
      state.cameras = action.payload;
    },
  },
});

export const { updateCameras } = camerasSlice.actions;

export default camerasSlice.reducer;
