import { configureStore } from '@reduxjs/toolkit';
import camerasReducer from './slices/camerasSlice';
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

import expireReducer from 'redux-persist-expire';
import storage from 'redux-persist/lib/storage';

const getConfig = (key, lifeInSeconds) => {
  const config = {
    key: key,
    version: 1,
    storage,
  };

  if (lifeInSeconds) {
    config.transforms = [
      expireReducer('preference', {
       expireSeconds: lifeInSeconds,
      })
    ];
  }

  return config;
}

const store = configureStore({
  reducer: {
    cameras: persistReducer(getConfig('cameras', 60), camerasReducer),
    events: persistReducer(getConfig('events', 60), eventsReducer),
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
