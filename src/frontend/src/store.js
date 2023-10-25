import { configureStore } from '@reduxjs/toolkit';
import camerasReducer from './slices/camerasSlice';
import eventsReducer from './slices/eventsSlice';
import eventFiltersReducer from './slices/eventFiltersSlice';
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

const store = configureStore({
  reducer: {
    cameras: persistReducer(getConfig('cameras'), camerasReducer),
    events: persistReducer(getConfig('events'), eventsReducer),
    eventFilters: persistReducer(getConfig('eventFilters'), eventFiltersReducer),
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
