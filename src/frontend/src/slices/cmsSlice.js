import { createSlice } from '@reduxjs/toolkit';

export const cmsInitialState = {
  list: null,
  timeStamp: null,
  filteredList: null,
  filterPoints: null,
}

export const cmsSlice = createSlice({
  name: 'cms',
  initialState: {
    advisories: cmsInitialState,
    bulletins: cmsInitialState,
  },
  reducers: {
    updateAdvisories: (state, action) => {
      state.advisories = action.payload;
    },
    updateBulletins: (state, action) => {
      state.bulletins = action.payload;
    }
  },
});

export const { updateAdvisories, updateBulletins } = cmsSlice.actions;

export default cmsSlice.reducer;
