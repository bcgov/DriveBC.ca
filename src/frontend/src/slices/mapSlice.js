import { createSlice } from '@reduxjs/toolkit';

export const mapSlice = createSlice({
  name: 'map',
  initialState: {
    zoom: 10,
    pan: [-122.7497299799772, 53.917075225412546],
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
