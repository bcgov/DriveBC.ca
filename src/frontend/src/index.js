// React
import React from 'react';

// Third-party packages
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom/client';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import { PersistGate } from 'redux-persist/integration/react'

// Components and functions
import App from './App';
import {store, persistor} from './store'

TimeAgo.addDefaultLocale(en);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
        </PersistGate>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
