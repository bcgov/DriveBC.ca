import { configureStore } from '@reduxjs/toolkit';

import camerasReducer from './slices/camerasSlice';
import cmsReducer from './slices/cmsSlice';
import eventsReducer from './slices/eventsSlice';
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

import localforage from 'localforage';
import storage from 'redux-persist/lib/storage';

const getConfig = (key) => {
  return {
    key: key,
    storage: localforage,
  }
}

const store = configureStore({
  reducer: {
    cameras: persistReducer(getConfig('cameras'), camerasReducer),
    cms: persistReducer(getConfig('cms'), cmsReducer),
    events: persistReducer(getConfig('events'), eventsReducer),
    routes: persistReducer(getConfig('routes'), routesReducer),
    map: persistReducer(getConfig('map'), mapReducer),
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
