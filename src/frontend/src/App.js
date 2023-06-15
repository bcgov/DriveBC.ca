import React from "react";

import { Route, Routes } from "react-router-dom";
import "@bcgov/bc-sans/css/BCSans.css";
import "./App.scss";
import "./styles/variables.scss";
import Header from "./Header.js";
import MapPage from "./pages/MapPage";
import StylesPage from "./pages/StylesPage";
import CamerasPage from "./pages/CamerasPage";

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/cameraspage" element={<CamerasPage />} />
        <Route path="/stylespage" element={<StylesPage />} />
      </Routes>
    </div>
  );
}

export default App;
