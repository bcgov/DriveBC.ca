import { configureStore } from '@reduxjs/toolkit';
import routesReducer from './slices/routesSlice';
import mapReducer from './slices/mapSlice';

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import storage from 'redux-persist/lib/storage';

const getConfig = (key) => {
  return {
    key: key,
    version: 1,
    storage,
  }
}

const persistedMapReducer = persistReducer(getConfig('map'), mapReducer);
const persistedRoutesReducer = persistReducer(getConfig('routes'), routesReducer);

const store = configureStore({
  reducer: {
    routes: persistedRoutesReducer,
    map: persistedMapReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

const persistor = persistStore(store);

export { store, persistor };
