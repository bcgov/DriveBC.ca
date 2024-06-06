// React
import React, { createContext, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

// Styling
import '@bcgov/bc-sans/css/BCSans.css';
import './App.scss';

// Components and functions
import Header from './Header.js';
import MapPage from './pages/MapPage';
import CamerasListPage from './pages/CamerasListPage';
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

// https://github.com/dai-shi/proxy-memoize?tab=readme-ov-file#usage-with-immer
import { setAutoFreeze } from 'immer';
setAutoFreeze(false);

// FontAwesome Stylesheet
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

export const MapContext = createContext(null);
export const CamsContext = createContext(null);


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

  const [mapContext, setMapContext] = useState(getInitialMapContext());
  const [camsContext] = useState({ displayLength: 21, setDisplayLength: (length) => {} });

  return (
    <MapContext.Provider value={{ mapContext, setMapContext }}>
      <CamsContext.Provider value={{ camsContext }}>
        <div className="App">
          <Header />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/cameras" element={<CamerasListPage />} />
            <Route path="/cameras/:id" element={<CameraDetailsPage />} />
            <Route path="/delays" element={<EventsListPage />} />
            <Route path="/advisories" element={<AdvisoriesListPage />} />
            <Route path="/advisories/:id" element={<AdvisoryDetailsPage />} />
            <Route path="/bulletins" element={<BulletinsListPage />} />
            <Route path="/bulletins/:id" element={<BulletinDetailsPage />} />
            {/* Catch-all route for 404 errors */}
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/website-problem" element={<div>Website Problem or Suggestion Page</div>} />
            <Route path="/highway-problem" element={<ReportRoadPage />} />
            <Route path="/road-electrical-problem" element={<div>Road Electrical Problem Page</div>} />
          </Routes>
        </div>
      </CamsContext.Provider>
    </MapContext.Provider>
  );
}

export default App;
