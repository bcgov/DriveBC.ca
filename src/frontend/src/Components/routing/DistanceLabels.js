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
import { destination, point, distance } from "@turf/turf";

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
    if (!route || !mapLayers.current.routeLayer) {
      return;
    }

    const routeFeatures = mapLayers.current.routeLayer.getSource().getFeatures();
    for (const feature of routeFeatures) {
      if (feature.get('searchTimestamp') === route.searchTimestamp) {
        feature.set('clicked', true);
        feature.setStyle(routeStyles['active']);
        updateClickedFeature(feature);

      } else {
        feature.set('clicked', false);
        feature.setStyle(routeStyles['static']);
      }
    }
  }

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

    const latlngs = searchedRoutes.map((route) => {
      return new LineString((Array.isArray(route.route) ? route.route : route.route.coordinates[0])).getCoordinateAt(0.5);
    });
    const isTooClose = arePointsClose(latlngs);

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
