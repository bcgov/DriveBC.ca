import { configureStore } from '@reduxjs/toolkit';

import { camerasInitialState } from './slices/camerasSlice';
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

import expireReducer from './expireReducer';

const getConfig = (key, lifeInSeconds, initialState) => {
  const config = {
    key: key,
    storage: localforage,
  };

  if (lifeInSeconds && initialState) {
    config.transforms = [
      expireReducer(key, {
        persistedAtKey: key + "Expires",
        expireSeconds: lifeInSeconds,
        expiredState: initialState
      })
    ];
  }

  return config;
}

const store = configureStore({
  reducer: {
    cameras: persistReducer(getConfig('cameras', 10, camerasInitialState), camerasReducer),
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
