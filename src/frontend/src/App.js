import React from 'react';
import { Route, Routes } from 'react-router-dom';
import '@bcgov/bc-sans/css/BCSans.css';
import './App.scss';
import './styles/variables.scss';
import Header from './Header.js';
import MapPage from './pages/MapPage';
import CamerasPage from './pages/CamerasPage';
import CameraDetailsPage from './pages/CameraDetailsPage';

import { initws } from './websocket'

function App() {
  let ws = initws()
  ws.onmessage = function(e){
    console.log(e)
  }

  ws.onopen = function () {
    ws.send(JSON.stringify({
      action: "subscribe_to_webcam_activity",
      request_id: new Date().getTime()
    }))
  }

  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/cameraspage" element={<CamerasPage />} />
        <Route path="/cameradetailspage" element={<CameraDetailsPage />} />
      </Routes>
    </div>
  );
}

export default App;
