// React
import React from 'react';
import {useLocation} from 'react-router-dom';

// Third party packages
import {DndProvider} from 'react-dnd-multi-backend';
import {HTML5toTouch} from 'rdndmb-html5-to-touch';

// Components and functions
import Map from '../Components/Map.js';

// Styling
import '../Components/Map.scss';

export default function MapPage() {
  const {state} = useLocation();
  return (
    <DndProvider options={HTML5toTouch}>
      <div className="map-wrap">
        <Map camera={state}/>
      </div>
    </DndProvider>
  );
}
