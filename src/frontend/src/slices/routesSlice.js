import { createSlice } from '@reduxjs/toolkit'

export const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    selectedRoute: {},
  },
  reducers: {
    updateSelectedRoute: (state, action) => {
      console.log(action.payload);
      state.selectedRoute = action.payload;
    },
  },
})

export const { updateSelectedRoute } = routesSlice.actions

export default routesSlice.reducer
