import React from 'react';
import { Route, Routes } from 'react-router-dom';
import '@bcgov/bc-sans/css/BCSans.css';
import './App.scss';
import './styles/variables.scss';
import Header from './Header.js';
import MapPage from './pages/MapPage';
import CamerasPage from './pages/CamerasPage';
import CameraDetailsPage from './pages/CameraDetailsPage';
import EventsPage from './pages/EventsPage';
import ScrollToTop from './Components/ScrollToTop';

function App() {
  return (
    <div className="App">
      <Header />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/cameraspage" element={<CamerasPage />} />
        <Route path="/cameradetailspage" element={<CameraDetailsPage />} />
        <Route path="/eventspage" element={<EventsPage />} />
      </Routes>
    </div>
  );
}

export default App;
