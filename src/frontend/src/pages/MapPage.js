// React
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom';

// Third party packages
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';

// Components and functions
import { getRoute } from '../Components/data/routes.js';
import { updateSelectedRoute } from '../slices/routesSlice'
import Map from '../Components/Map.js';

// Styling
import '../Components/Map.scss';

export default function MapPage() {
  // Redux
  const selectedRoute = useSelector((state) => state.routes.selectedRoute);
  const dispatch = useDispatch();

  const { state } = useLocation();

  useEffect(() => {
    getRoute().then(routeData => {
      dispatch(updateSelectedRoute(routeData));
    });
  }, []);

  return (
    <DndProvider options={HTML5toTouch}>
      <div className="map-wrap">
        <Map camera={state} selectedRoute={selectedRoute} />
      </div>
    </DndProvider>
  );
}
