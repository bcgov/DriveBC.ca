import { createSlice } from '@reduxjs/toolkit';

export const mapSlice = createSlice({
  name: 'map',
  initialState: {
    zoom: 5,
    pan: [-122.917225601, 53.926987801],
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
