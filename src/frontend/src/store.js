import { configureStore } from '@reduxjs/toolkit';

import { cmsInitialState } from './slices/cmsSlice';
import { feedsInitialState } from './slices/feedsSlice';
import feedsReducer from './slices/feedsSlice';
import cmsReducer from './slices/cmsSlice';
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
        expireSeconds: lifeInSeconds,
        expiredState: initialState
      })
    ];
  }

  return config;
}

const store = configureStore({
  reducer: {
    feeds: persistReducer(getConfig('feeds', 60, feedsInitialState), feedsReducer),
    cms: persistReducer(getConfig('cms', 60, cmsInitialState), cmsReducer),
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
