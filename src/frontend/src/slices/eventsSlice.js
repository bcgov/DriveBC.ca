import { createSlice } from '@reduxjs/toolkit';

export const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    events: {},
  },
  reducers: {
    updateEvents: (state, action) => {
      state.events = action.payload;
    },
  },
});

export const { updateEvents } = eventsSlice.actions;

export default eventsSlice.reducer;
