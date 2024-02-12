// React
import React from 'react';

// Third-party packages
import { BrowserRouter } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom/client';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';

// Components and functions
import App from './App';
import './env.js';
import { store, persistor } from './store';

TimeAgo.addDefaultLocale(en);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <GoogleReCaptchaProvider reCaptchaKey={`${window.RECAPTCHA_SITE_KEY}`}>
            <App />
          </GoogleReCaptchaProvider>
        </PersistGate>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);
