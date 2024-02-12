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
import FeedbackPage from './pages/FeedbackPage';
import ScrollToTop from './Components/ScrollToTop';

export const MapContext = createContext(null);

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
      },
    };
  }

  const [mapContext, setMapContext] = useState(getInitialMapContext());

  return (
    <MapContext.Provider value={{ mapContext, setMapContext }}>
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
          <Route path="/feedback" element={<FeedbackPage />} />
        </Routes>
      </div>
    </MapContext.Provider>
  );
}

export default App;
