import React from 'react';
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import "../Components/Map.scss"
import Map from '../Components/Map.js';

export default function MapPage() {
  return (
    <DndProvider options={HTML5toTouch}>
      <div className="map-wrap">
      <Map/>
      </div>
    </DndProvider>
  );
}
