import React from 'react'
import { DndProvider } from 'react-dnd-multi-backend'
import { HTML5toTouch } from 'rdndmb-html5-to-touch'

import { Route, Routes } from 'react-router-dom';
import '@bcgov/bc-sans/css/BCSans.css';
import './App.scss';
import Header from './Header.js';
import MapPage from './pages/MapPage';
import StylesPage from './pages/StylesPage';

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<MapPage />}/>
        <Route path="/stylespage" element={<StylesPage />} />
      </Routes>
    </div>
  );
}

export default App;
