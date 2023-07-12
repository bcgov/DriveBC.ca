// React
import React, { createContext, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

// Components and functions
import Header from './Header.js';
import MapPage from './pages/MapPage';
import CamerasPage from './pages/CamerasPage';
import CameraDetailsPage from './pages/CameraDetailsPage';
import EventsPage from './pages/EventsPage';
import ScrollToTop from './Components/ScrollToTop';

// Styling
import '@bcgov/bc-sans/css/BCSans.css';
import './App.scss';
import './styles/variables.scss';

export const MapContext = createContext(null);


function App() {
  function getInitialMapContext() {
    const context = localStorage.getItem('mapContext');
    return context ? JSON.parse(context) : {
      visible_layers: {
        eventsLayer: true,
        highwayLayer: false,
        open511Layer: false,
        webcamsLayer: true
      },
    };
  }

  const [mapContext, setMapContext] = useState(getInitialMapContext());

  return (
    <MapContext.Provider value={{ mapContext, setMapContext }}>
      <div className="App">
        <Header />
        <ScrollToTop/>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/cameraspage" element={<CamerasPage />} />
          <Route path="/cameradetailspage" element={<CameraDetailsPage />} />
          <Route path="/eventspage" element={<EventsPage />} />
        </Routes>
      </div>
    </MapContext.Provider>
  );
}

export default App;
