// React
import React, { useCallback, useEffect } from 'react';

// Redux
import { useSelector } from "react-redux";
import { memoize } from "proxy-memoize";

// Internal imports
import { compareRoutes } from "../data/routes";
import { removeOverlays } from "../map/helpers";

// External imports
import { Overlay } from "ol";
import { fromLonLat } from "ol/proj";
import { LineString } from "ol/geom";
import { destination, point, distance } from "@turf/turf";

// Styling
import './DistanceLabels.scss';

export default function DistanceLabels(props) {
  /* initialization */
  // Props
  const { updateRouteDisplay, mapRef, isCamDetail } = props;

  // Map not loaded, do nothing
  if (!mapRef || !mapRef.current) {
    return;
  }

  // Redux
  const {
    routes: { searchedRoutes, selectedRoute },

  } = useSelector(
    useCallback(
      memoize(state => ({
        routes: state.routes,
      })),
    ),
  );

  /* useEffect hooks */
  useEffect(() => {
    addDistanceOverlay();
    updateRouteDisplay(selectedRoute);
  }, [selectedRoute]);

  /* Rendering */
  // Threshold of 500 meters in distance by default
  const arePointsClose = (coords, threshold = 5000) => {
    if (!coords || coords.length < 2) {
      return false;
    }

    const dis = distance(point(coords[0]), point(coords[1]), { units: 'kilometers' });
    return dis < threshold/1000;
  }

  const addDistanceOverlay = (closing=false) => {
    removeOverlays(mapRef);

    const routeData = isCamDetail ? [selectedRoute] : searchedRoutes;

    const latlngs = routeData.map((route) => {
      return new LineString((Array.isArray(route.route) ? route.route : route.route.coordinates[0])).getCoordinateAt(0.5);
    });
    const isTooClose = arePointsClose(latlngs);

    routeData.forEach((route, index) => {
      const elem = document.createElement('div');

      elem.addEventListener('click', () => {
        updateRouteDisplay(route);
      });

      const roundedDistance = Math.round(route.distance);

      const showAsSelected = !closing && compareRoutes(route, selectedRoute);
      elem.className = showAsSelected ? 'distance-overlay selected' : 'distance-overlay';
      if (routeData.length === 1) {
        elem.innerHTML = `<span class="distance-text">${roundedDistance} km</span>`;

      } else if (showAsSelected) {
        elem.innerHTML = `
          <span class="index-label">${(index === 0) ? 'A' : 'B'}</span>
          <span class="distance-text">${roundedDistance} km</span>
        `;

      } else {
        // Inverted selected styling for index bubble
        elem.innerHTML = `
          <span class="index-label">${(index === 0) ? 'A' : 'B'}</span>
          <span class="distance-text">${roundedDistance} km</span>
        `;
      }

      const routeLs = new LineString(Array.isArray(route.route) ? route.route : route.route.coordinates[0]);
      let midPointLatLng = routeLs.getCoordinateAt(0.5);
      if (isTooClose) {
        midPointLatLng = routeLs.getCoordinateAt(index === 0 ? 0.46 : 0.54);
      }

      // Offset the coordinates in meters
      const offsetY = 300;
      const offsetPoint = destination(point(midPointLatLng), offsetY, 0, { units: 'meters' });
      const offsetMidPointLatLng = offsetPoint.geometry.coordinates;

      const overlay = new Overlay({
        position: fromLonLat(offsetMidPointLatLng),
        element: elem,
        positioning: 'bottom-center',
        stopEvent: true,
      });

      mapRef.current.addOverlay(overlay);
    });
  }

  return <div />;
}
