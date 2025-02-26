// React
import React from 'react';
import { useSearchParams } from 'react-router-dom';

// Third party packages
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';

// Components and functions
import MapWrapper from '../Components/map/MapWrapper.js';

// Styling
import '../Components/map/Map.scss';

export default function MapPage() {
  const [searchParams] = useSearchParams();

  document.title = 'DriveBC';

  const referenceData = {
    type: searchParams.get('type'),
    id: searchParams.get('id'),
    display_category: searchParams.get('display_category'),
    searchTimestamp: searchParams.get('searchTimestamp'),
    notification: searchParams.get('notification'),
  };

  return (
    <DndProvider options={HTML5toTouch}>
      <div className="map-wrap">
        <MapWrapper referenceData={referenceData} />
      </div>
    </DndProvider>
  );
}
