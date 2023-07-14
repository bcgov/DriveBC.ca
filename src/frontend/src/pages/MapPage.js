import React from 'react';
import { useLocation } from "react-router-dom";
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import "../Components/Map.scss"
import Map from '../Components/Map.js';

export default function MapPage() {

  const { state } = useLocation();
  return (
    <DndProvider options={HTML5toTouch}>
      <div className="map-wrap">
      <Map camera={state}/>
      </div>
    </DndProvider>
  );
}
