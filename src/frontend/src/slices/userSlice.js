import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    favCams: null,
    favRoutes: null,
    pendingAction: null
  },
  reducers: {
    // General
    resetFavLists: (state, action) => {
      state.favCams = null;
      state.favRoutes = null;
    },

    // Cams
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

    // Routes
    updateFavRoutes: (state, action) => {
      state.favRoutes = action.payload;
    },
    pushFavRoute: (state, action) => {
      const resFavRoutes = !state.favRoutes ? [] : [...state.favRoutes];
      resFavRoutes.push(action.payload);

      state.favRoutes = resFavRoutes;
    },
    removeFavRoute: (state, action) => {
      const resFavRoutes = !state.favRoutes ? [] : [...state.favRoutes];
      state.favRoutes = resFavRoutes.filter(route => route.id != action.payload);
    },

    // Pending action
    updatePendingAction: (state, action) => {
      state.pendingAction = action.payload;
    },
    resetPendingAction: (state, action) => {
      state.pendingAction = null;
    },
  },
});

export const {
  resetFavLists, // General
  updateFavCams, pushFavCam, removeFavCam, // Cams
  updateFavRoutes, pushFavRoute, removeFavRoute, // Routes
  updatePendingAction, resetPendingAction // Pending action
} = userSlice.actions;

export default userSlice.reducer;
