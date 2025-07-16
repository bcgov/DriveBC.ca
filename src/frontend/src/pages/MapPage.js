// React
import React, { useEffect, useState, useContext } from 'react';
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


// Internal imports
// import { HeaderHeightContext } from '../App.js';
import EmergencyAlert from "../Components/shared/EmergencyAlert.js";

// External Imports
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import { useMediaQuery } from '@uidotdev/usehooks';

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

  const getReferenceParams = () => {
    return {
      type: searchParams.get('type'),
      id: searchParams.get('id'),
      display_category: searchParams.get('display_category'),
    };
  }
  const [referenceData, setReferenceData] = useState(null);

  // Effects
  useEffect(() => {
    setReferenceData(getReferenceParams());
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

  // const { headerHeightContext } = useContext(HeaderHeightContext);

  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  /* Rendering */
  // Main component
  return (
    <DndProvider options={HTML5toTouch}>
      <div className="map-page map-wrap">
        {/* Need this to show alert above Map; duplicates App level alert which is hidden by map */}
        {/* <EmergencyAlert /> */}

        {referenceData &&
          <MapWrapper referenceData={referenceData} />
        }
      </div>
    </DndProvider>
  );
}
