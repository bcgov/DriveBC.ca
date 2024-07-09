// React
import React, { createContext, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

// Styling
import '@bcgov/bc-sans/css/BCSans.css';
import './App.scss';

// Components and functions
import Header from './Header.js';
import MapPage from './pages/MapPage';
import DemoPage from './pages/DemoPage.js';
import CamerasListPage from './pages/CamerasListPage';
// import MyCamerasListPage from './pages/MyCamerasListPage';
import CameraDetailsPage from './pages/CameraDetailsPage';
import EventsListPage from './pages/EventsListPage';
import AdvisoriesListPage from './pages/AdvisoriesListPage';
import AdvisoryDetailsPage from './pages/AdvisoryDetailsPage';
import BulletinsListPage from './pages/BulletinsListPage';
import BulletinDetailsPage from './pages/BulletinDetailsPage';
import ScrollToTop from './Components/shared/ScrollToTop';
import NotFoundPage from './pages/NotFoundPage';
import ProblemsPage from './pages/ProblemsPage.js';
import ReportRoadPage from './pages/ReportRoadPage';
import ReportElectricalPage from './pages/ReportElectricalPage';
import Modal from './Modal.js';
import AccountPage from './pages/AccountPage';

// https://github.com/dai-shi/proxy-memoize?tab=readme-ov-file#usage-with-immer
import { setAutoFreeze } from 'immer';
setAutoFreeze(false);

// FontAwesome Stylesheet
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { getFavoriteCameras } from './Components/data/webcams.js';
config.autoAddCss = false

export const MapContext = createContext(null);
export const CamsContext = createContext(null);
export const AuthContext = createContext(null);

let callingSession = false;

function App() {
  function getInitialMapContext() {
    const context = localStorage.getItem('mapContext');
    return context ? JSON.parse(context) : {
      visible_layers: {
        closures: true,
        majorEvents: true,
        minorEvents: false,
        futureEvents: false,
        roadConditions: true,
        highwayCams: false,
        inlandFerries: true,
        weather: false,
        restStops: false,
        largeRestStops: false,
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
            getFavoriteCameras();
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
  const [camsContext] = useState({ displayLength: 21, setDisplayLength: (length) => {} });
  const [authContext, setAuthContext] = useState(getInitialAuthContext());

  return (
    <AuthContext.Provider value={{ authContext, setAuthContext }}>
      <MapContext.Provider value={{ mapContext, setMapContext }}>
        <CamsContext.Provider value={{ camsContext }}>
          <div className="App">
            <Header />
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/my-cameras" element={<CamerasListPage favorite={true} />} />
              <Route path="/cameras" element={<CamerasListPage favorite={false} />} />
              <Route path="/cameras/:id" element={<CameraDetailsPage />} />
              <Route path="/delays" element={<EventsListPage />} />
              <Route path="/advisories" element={<AdvisoriesListPage />} />
              <Route path="/advisories/:id" element={<AdvisoryDetailsPage />} />
              <Route path="/bulletins" element={<BulletinsListPage />} />
              <Route path="/bulletins/:id" element={<BulletinDetailsPage />} />
              <Route path="/account" element={<AccountPage />} />
              {/* Catch-all route for 404 errors */}
              <Route path="*" element={<NotFoundPage />} />
              <Route path="/problems" element={<ProblemsPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/website-problem" element={<div>Website Problem or Suggestion Page</div>} />
              <Route path="/highway-problem" element={<ReportRoadPage />} />
              <Route path="/road-electrical-problem" element={<ReportElectricalPage />} />
            </Routes>
            <Modal />
          </div>
        </CamsContext.Provider>
      </MapContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
