import React from 'react';
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';

import Map from '../Components/Map.js';

export default function MapPage() {
  return (
    <DndProvider options={HTML5toTouch}>
      <Map />
    </DndProvider>
  );
}