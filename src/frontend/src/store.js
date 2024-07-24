// Redux
import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer
} from 'redux-persist';
import localforage from 'localforage';

// Components and functions
import expireReducer from './expireReducer';

// Slices
import { cmsInitialState } from './slices/cmsSlice';
import { feedsInitialState } from './slices/feedsSlice';
import cmsReducer from './slices/cmsSlice';
import feedsReducer from './slices/feedsSlice';
import mapReducer from './slices/mapSlice';
import routesReducer from './slices/routesSlice';
import userReducer from './slices/userSlice';
import highwayFilterReducer from './slices/highwayFilterSlice';

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
    highwayFilter: persistReducer(getConfig('highwayFilter'), highwayFilterReducer),
    routes: persistReducer(getConfig('routes'), routesReducer),
    map: persistReducer(getConfig('map'), mapReducer),
    user: persistReducer(getConfig('user'), userReducer),
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // Disable checks to prevent rendering lag in dev mode
      serializableCheck: false,
      immutableCheck: false,
    }),
});

const persistor = persistStore(store);

export { store, persistor };
