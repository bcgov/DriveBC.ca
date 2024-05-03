// React
import React from 'react';
import { useLocation } from 'react-router-dom';

// Third party packages
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';

// Components and functions
import MapWrapper from '../Components/map/MapWrapper.js';

// Styling
import '../Components/map/Map.scss';

export default function MapPage() {
  const { state } = useLocation();

  document.title = 'DriveBC';

  return (
    <DndProvider options={HTML5toTouch}>
      <div className="map-wrap">
        <MapWrapper referenceData={state} />
      </div>
    </DndProvider>
  );
}
