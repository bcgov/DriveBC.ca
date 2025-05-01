// React
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Redux
import { useDispatch } from "react-redux";
import {
  clearSearchedRoutes,
  clearSelectedRoute,
  updateRouteDistance,
  updateSearchLocationFrom,
  updateSearchLocationTo
} from "../slices";

// External Imports
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';

// Internal imports
import { shortenToOneDecimal } from "../Components/data/routes";
import MapWrapper from '../Components/map/MapWrapper.js';

// Styling
import '../Components/map/Map.scss';

export default function MapPage() {
  /* Setup */
  // Redux
  const dispatch = useDispatch();

  // Navigation
  const [searchParams] = useSearchParams();

  document.title = 'DriveBC';

  const [referenceData, setReferenceData] = useState({
    type: null,
    id: null,
    display_category: null,
  });

  // Effects
  useEffect(() => {
    setReferenceData({
      type: searchParams.get('type'),
      id: searchParams.get('id'),
      display_category: searchParams.get('display_category'),
    });
  }, [searchParams]);

  useEffect(() => {
    populateRoutesFromNotification();
  }, []);

  /* Helpers */
  const populateRoutesFromNotification = async () => {
    // DBC22-3396: populate route data from notifications
    const routeData = {
      route_start: searchParams.get('route_start'),
      route_start_point: searchParams.get('route_start_point'),
      route_end: searchParams.get('route_end'),
      route_end_point: searchParams.get('route_end_point'),
      route_distance: searchParams.get('route_distance'),
    }

    if (routeData.route_distance) {
      dispatch(clearSearchedRoutes());
      dispatch(clearSelectedRoute());
      dispatch(updateRouteDistance(shortenToOneDecimal(parseFloat(routeData.route_distance))));

      // Start point
      const route_start_coords = [
        parseFloat(routeData.route_start_point.split(',')[0]),
        parseFloat(routeData.route_start_point.split(',')[1])
      ];

      const start_point = [{
        geometry: {
          type: 'Point',
          coordinates: route_start_coords
        },
        label: routeData.route_start
      }];

      dispatch(updateSearchLocationFrom(start_point));

      // End point
      const route_end_coords = [
        parseFloat(routeData.route_end_point.split(',')[0]),
        parseFloat(routeData.route_end_point.split(',')[1])
      ];

      const end_point = [{
        geometry: {
          type: 'Point',
          coordinates: route_end_coords
        },
        label: routeData.route_end
      }];

      dispatch(updateSearchLocationTo(end_point));
    }
  }

  /* Rendering */
  // Main component
  return (
    <DndProvider options={HTML5toTouch}>
      <div className="map-wrap">
        <MapWrapper referenceData={referenceData} />
      </div>
    </DndProvider>
  );
}
