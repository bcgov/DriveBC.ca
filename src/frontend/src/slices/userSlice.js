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

      // Push if not already in the list
      if (!resFavCams.some(camId => camId === action.payload)) { // payload is ID only due to cam group references
        resFavCams.push(action.payload);
        state.favCams = resFavCams;
      }
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
    updateSingleFavRoute: (state, action) => {
      const index = state.favRoutes.findIndex(savedRoute => savedRoute.id === action.payload.id);
      if (index !== -1) {
        state.favRoutes[index] = action.payload;
      }
    },
    removeFavRoute: (state, action) => {
      const resFavRoutes = !state.favRoutes ? [] : [...state.favRoutes];
      state.favRoutes = resFavRoutes.filter(route => route.id != action.payload);
    },

    // Pending action
    updatePendingAction: (state, action) => {
      const originalState = !state.pendingAction ? {} : state.pendingAction;
      state.pendingAction = {...originalState, ...action.payload};
    },
    resetPendingAction: (state, action) => {
      state.pendingAction = null;
    },
  },
});

export const {
  resetFavLists, // General
  updateFavCams, pushFavCam, removeFavCam, // Cams
  updateFavRoutes, pushFavRoute, removeFavRoute, updateSingleFavRoute, // Routes
  updatePendingAction, resetPendingAction // Pending action
} = userSlice.actions;

export default userSlice.reducer;
