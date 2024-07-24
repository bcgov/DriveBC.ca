import { createSlice } from '@reduxjs/toolkit';

export const highwayFilterInitialState = null;

export const highwayFilterSlice = createSlice({
  name: 'highwayFilter',
  initialState: {
    highways: highwayFilterInitialState,
  },
  reducers: {
    updateHighwayFilter: (state, action) => {
      state.highways = action.payload;
    },
  },
});

export const { updateHighwayFilter } = highwayFilterSlice.actions;

export default highwayFilterSlice.reducer;
