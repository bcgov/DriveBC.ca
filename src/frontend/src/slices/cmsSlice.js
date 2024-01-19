import { createSlice } from '@reduxjs/toolkit';

export const cmsSlice = createSlice({
  name: 'cms',
  initialState: {
    advisories: null,
    bulletins: null,
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
