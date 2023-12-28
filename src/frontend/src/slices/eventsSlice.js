import { createSlice } from '@reduxjs/toolkit';

export const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    list: null,
    routeTimeStamp: null
  },
  reducers: {
    updateEvents: (state, action) => {
      const { list, routeTimeStamp } = action.payload;
      state.list = list;
      state.routeTimeStamp = routeTimeStamp;
    },
  },
});

export const { updateEvents } = eventsSlice.actions;

export default eventsSlice.reducer;
