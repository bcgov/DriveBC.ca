import { createSlice } from '@reduxjs/toolkit';

export const mapSlice = createSlice({
  name: 'map',
  initialState: {
    zoom: 6,
    pan: [-126.40216584353347, 53.24106084212411],
  },
  reducers: {
    updateMapState: (state, action) => {
      state.zoom = action.payload.zoom;
      state.pan = action.payload.pan;
    },
  },
});

export const { updateMapState } = mapSlice.actions;

export default mapSlice.reducer;
