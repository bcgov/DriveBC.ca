import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    favCams: null,
    favRoutes: null
  },
  reducers: {
    resetFavLists: (state, action) => {
      state.favCams = null;
      state.favRoutes = null;
    },
    updateFavCams: (state, action) => {
      state.favCams = action.payload;
    },
    pushFavCam: (state, action) => {
      const resFavCams = !state.favCams ? [] : [...state.favCams];
      resFavCams.push(action.payload);

      state.favCams = resFavCams;
    },
    removeFavCam: (state, action) => {
      const resFavCams = !state.favCams ? [] : [...state.favCams];
      state.favCams = resFavCams.filter(camID => camID != action.payload);
    },
    clearFavCams: (state, action) => {
      state.favCams = [];
    }
  },
});

export const { resetFavLists, updateFavCams, pushFavCam, removeFavCam, clearFavCams } = userSlice.actions;

export default userSlice.reducer;
