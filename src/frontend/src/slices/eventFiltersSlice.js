import { createSlice } from '@reduxjs/toolkit';

export const eventFiltersSlice = createSlice({
  name: 'eventFilters',
  initialState: {
    filterSet: {'CONSTRUCTION': false,
    'INCIDENT': false,
    'SPECIAL_EVENT': false,
    'WEATHER_CONDITION': false,},
  },
  reducers: {
    updateEventFilters: (state, action) => {
      state.filterSet = action.payload;
    },
  },
});
export const { updateEventFilters } = eventFiltersSlice.actions;

export default eventFiltersSlice.reducer;
