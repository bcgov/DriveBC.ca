// React
import React, { useCallback, useEffect } from 'react';

// Redux
import { useSelector } from "react-redux";
import { memoize } from "proxy-memoize";

// Internal imports
import { removeOverlays } from "../map/helpers";

// External imports
import { Overlay } from "ol";
import { fromLonLat } from "ol/proj";
import { LineString } from "ol/geom";
import { destination, point } from "@turf/turf";

// Styling
import './DistanceLabels.scss';
import { routeStyles } from "../data/featureStyleDefinitions";

export default function DistanceLabels(props) {
  /* initialization */
  // Props
  const { mapLayers, mapRef, updateClickedFeature } = props;

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
    updateMapDisplay(selectedRoute);
  }, [selectedRoute]);

  /* Rendering */
  const updateMapDisplay = (route) => {
    if (!route) {
      return;
    }

    const routeFeatures = mapLayers.current.routeLayer.getSource().getFeatures();
    for (const feature of routeFeatures) {
      if (feature.get('searchTimestamp') === route.searchTimestamp) {
        feature.set('clicked', true);
        updateClickedFeature(feature);
        feature.setStyle(routeStyles['active']);

      } else {
        feature.set('clicked', false);
        feature.setStyle(routeStyles['static']);
      }
    }
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const radiusOfEarth = 6371000; // Radius of Earth in meters
    const radians1 = toRadians(lat1);
    const radians2 = toRadians(lat2);
    const deltaLatitude = toRadians(lat2 - lat1);
    const deltaLongitude = toRadians(lon2 - lon1);

    const a = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
              Math.cos(radians1) * Math.cos(radians2) *
              Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return radiusOfEarth * c; // Distance in meters
}

// Threshold of 500 meters in distance by default
const arePointsClose = (lat1, lon1, lat2, lon2, threshold = 500) => {
    const distance = haversineDistance(lat1, lon1, lat2, lon2);
    return distance < threshold;
}
  const addDistanceOverlay = (closing=false) => {
    removeOverlays(mapRef);
    const latlngs = [];
    searchedRoutes.forEach((route, index) => {
      const routeLs = new LineString(route.route);
      const midPointLatLng = routeLs.getCoordinateAt(0.5);
      latlngs.push(midPointLatLng[0]);
      latlngs.push(midPointLatLng[1]);
    });

    searchedRoutes.forEach((route, index) => {
      const elem = document.createElement('div');

      elem.addEventListener('click', () => {
        updateMapDisplay(route);
      });

      const roundedDistance = Math.round(route.distance);

      const showAsSelected = !closing && route.searchTimestamp === selectedRoute.searchTimestamp;
      elem.className = showAsSelected ? 'distance-overlay selected' : 'distance-overlay';
      elem.innerHTML = showAsSelected ? `
        <span class="index-label">${index + 1}</span>
        <span class="distance-text">${roundedDistance} km</span>
      ` : `
        <span class="index-label selected">${index + 1}</span>
        <span class="distance-text">${roundedDistance} km</span>
      `;

      const routeLs = new LineString(route.route);
      let midPointLatLng = routeLs.getCoordinateAt(0.5);
      const isTooClose = arePointsClose(latlngs[0], latlngs[1], latlngs[2], latlngs[3]);
      if(isTooClose){
        if(index === 0){
          midPointLatLng = routeLs.getCoordinateAt(0.46);
        } else {
          midPointLatLng = routeLs.getCoordinateAt(0.54);
        }
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
