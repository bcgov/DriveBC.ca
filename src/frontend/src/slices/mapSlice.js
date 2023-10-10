import { createSlice } from '@reduxjs/toolkit'

export const mapSlice = createSlice({
  name: 'map',
  initialState: {
      zoom: 10,
      pan: [-120.7862, 50.113],
  },
  reducers: {
    updateMapState: (state, action) => {
      state.zoom = action.payload.zoom;
      state.pan = action.payload.pan;
    },
  },
})

export const { updateMapState } = mapSlice.actions

export default mapSlice.reducer
