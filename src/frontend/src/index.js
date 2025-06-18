// React
import React from 'react';

// Navigation
import { BrowserRouter } from 'react-router-dom';

// External imports
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

// <!-- Snowplow starts plowing - Standalone vE.2.14.0 -->
(function (p, l, o, w, i, n, g) {
  if (!p[i]) {
    p.GlobalSnowplowNamespace = p.GlobalSnowplowNamespace || [];
    p.GlobalSnowplowNamespace.push(i);
    p[i] = function () {
      // eslint-disable-next-line prefer-rest-params
      (p[i].q = p[i].q || []).push(arguments);
    };
    p[i].q = p[i].q || [];
    n = l.createElement(o);
    g = l.getElementsByTagName(o)[0];
    n.async = 1;
    n.src = w;
    g.parentNode.insertBefore(n, g);
  }
})(
  window,
  document,
  'script',
  'https://www2.gov.bc.ca/StaticWebResources/static/sp/sp-2-14-0.js',
  'snowplow',
);
let collector;
const hostname = window.location.hostname.toLowerCase();
if (hostname.indexOf('beta.drivebc.ca') > -1 || hostname.indexOf('www.drivebc.ca') > -1) {
  collector = 'spt.apps.gov.bc.ca';
} else {
  collector = 'spm.apps.gov.bc.ca';
}
window.snowplow('newTracker', 'rt', collector, {
  appId: 'Snowplow_standalone_DBC',
  cookieLifetime: 86400 * 548,
  platform: 'web',
  post: true,
  forceSecureTracker: true,
  contexts: {
    webPage: true,
    performanceTiming: true,
  },
});
window.snowplow('enableActivityTracking', 30, 30); // Ping every 30 seconds after 30 seconds
window.snowplow('enableLinkClickTracking');

// Only track page view if there is no anchor
if (!window.location.hash) {
  window.snowplow('trackPageView');
}

// <!-- Snowplow stops plowing -->
root.render(
  <BrowserRouter>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </BrowserRouter>
);
