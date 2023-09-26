import { configureStore } from '@reduxjs/toolkit'
import routesReducer from './slices/routesSlice'

export default configureStore({
  reducer: {
    routes: routesReducer,
  },
})
