// React
import React, { createContext, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

// Styling
import '@bcgov/bc-sans/css/BCSans.css';
import './App.scss';

// Components and functions
import Header from './Header.js';
import MapPage from './pages/MapPage';
import Modal from './Modal.js';
import AccountPage from './pages/AccountPage';
import CamerasPage from './pages/CamerasPage';
import CameraDetailsPage from './pages/CameraDetailsPage';
import EventsPage from './pages/EventsPage';
import AdvisoriesListPage from './pages/AdvisoriesListPage';
import AdvisoryDetailsPage from './pages/AdvisoryDetailsPage';
import BulletinsListPage from './pages/BulletinsListPage';
import BulletinDetailsPage from './pages/BulletinDetailsPage';
import ScrollToTop from './Components/ScrollToTop';

export const MapContext = createContext(null);
export const AuthContext = createContext(null);

let callingSession = false;

function App() {
  function getInitialMapContext() {
    const context = localStorage.getItem('mapContext');
    return context
      ? JSON.parse(context)
      : {
          visible_layers: {
            closures: true,
            majorEvents: true,
            minorEvents: true,
            futureEvents: true,
            roadConditions: true,
            highwayCams: true,
            inlandFerries: true,
          },
        };
  }

  function getInitialAuthContext() {
    if (!callingSession) {
      callingSession = true;

      fetch(`${window.API_HOST}/api/session`, {
        headers: { 'Accept': 'application/json' },
        credentials: "include",
      }).then((response) => response.json())
        .then((data) => {
          const ret = {
            loginStateKnown: true,
          }
          if (data.username) {
            ret.username = data.username;
            ret.email = data.email;
          }
          setAuthContext((prior) => {
            if (ret.loginStateKnown != prior.loginStateKnown) { return ret; }
            if (ret.username != prior.username) { return ret; }
            if (ret.email != prior.email) { return ret; }
            return prior;
          });
        })
        .finally(() => callingSession = false);
    }

    return { loginStateKnown: false }
  }

  const [mapContext, setMapContext] = useState(getInitialMapContext());
  const [authContext, setAuthContext] = useState(getInitialAuthContext());

  return (
    <AuthContext.Provider value={{ authContext, setAuthContext }}>
      <MapContext.Provider value={{ mapContext, setMapContext }}>
        <div className="App">
          <Header />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/cameras" element={<CamerasPage />} />
            <Route path="/cameras/:id" element={<CameraDetailsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/advisories" element={<AdvisoriesListPage />} />
            <Route path="/advisories/:id" element={<AdvisoryDetailsPage />} />
            <Route path="/bulletins" element={<BulletinsListPage />} />
            <Route path="/bulletins/:id" element={<BulletinDetailsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
          <Modal />
        </div>
      </MapContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
