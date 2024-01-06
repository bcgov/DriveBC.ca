import { createSlice } from '@reduxjs/toolkit';

export const cmsSlice = createSlice({
  name: 'cms',
  initialState: {
    advisories: null,
    bulletins: null,
    ferries: {
      list: null,
      routeTimeStamp: null,
    },
  },
  reducers: {
    updateAdvisories: (state, action) => {
      state.advisories = action.payload;
    },
    updateBulletins: (state, action) => {
      state.bulletins = action.payload;
    },
    updateFerries: (state, action) => {
      state.ferries = action.payload;
    },
  },
});

export const { updateAdvisories, updateBulletins, updateFerries } = cmsSlice.actions;

export default cmsSlice.reducer;
