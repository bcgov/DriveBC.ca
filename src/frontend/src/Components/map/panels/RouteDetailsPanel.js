// React
import React, { useCallback, useEffect, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';

// Internal imports
import RouteDetails from '../../routing/RouteDetails';
import { swapRoutesToFastest, swapRoutesToShortest } from '../../../slices/routesSlice';

// Styling
import './RouteDetailsPanel.scss';

// Overlay
import 'ol/ol.css';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';

export default function RouteDetailsPanel(props) {
  const { mapRef } = props
  /* Setup */
  const dispatch = useDispatch();
  // Redux
  const { fastestRoute } = useSelector(useCallback(memoize(state => ({
    fastestRoute: state.routes.fastestRoute
  }))));

  const { shortestRoute } = useSelector(useCallback(memoize(state => ({
    shortestRoute: state.routes.shortestRoute
  }))));

  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    addDistanceOverlay(mapRef, 0);

    return () => {
      removeDistanceOverlay(mapRef);
    };
  }, []);

  const removeDistanceOverlay = (mapRef) => {
    // Clone the overlays array to avoid issues when modifying the array during iteration
    const overlaysArray = [...mapRef.current.getOverlays().getArray()];

    overlaysArray.forEach((overlay) => {
      mapRef.current.removeOverlay(overlay);
    });
    setTimeout(function() {
      sessionStorage.setItem('isDistanceLayerAdded', 'false');
    }, 1000);
  };

  const addDistanceOverlay = (mapRef, selectedIndex) => {
    if (!fastestRoute || !shortestRoute) {
      return;
    }

    removeDistanceOverlay(mapRef);
    // first route distance overlay
    const distanceElementFirst = document.createElement('div');
    const roundedFastestDistance = Math.floor(fastestRoute.distance);
    if(selectedIndex === 0){
      distanceElementFirst.className = 'distance-overlay-selected';
      distanceElementFirst.innerHTML = `
      <span class="distance-icon-selected">1</span>
      <span class="distance-text-selected">${roundedFastestDistance} km</span>
    `;
    } else {
      distanceElementFirst.className = 'distance-overlay-alternate';
      distanceElementFirst.innerHTML = `
      <span class="distance-icon-alternate">2</span>
      <span class="distance-text-alternate">${roundedFastestDistance} km</span>
    `;
    }

    const midpointFistRoute = fastestRoute.directions[Math.floor(fastestRoute.directions.length / 2)];
    const distanceOverlayFirst = new Overlay({
      position: fromLonLat(midpointFistRoute.point),
      element: distanceElementFirst,
      positioning: 'bottom-center',
      stopEvent: false,
    });

    mapRef.current.addOverlay(distanceOverlayFirst);

    // second route distance overlay
    const distanceElementSecond = document.createElement('div');
    const roundedShortestDistance = Math.floor(shortestRoute.distance);
    if(selectedIndex === 0){
      distanceElementSecond.className = 'distance-overlay-alternate';
      distanceElementSecond.innerHTML = `
      <span class="distance-icon-alternate">2</span>
      <span class="distance-text-alternate">${roundedShortestDistance} km</span>
    `;
    } else {
      distanceElementSecond.className = 'distance-overlay-selected';
      distanceElementSecond.innerHTML = `
      <span class="distance-icon-selected">1</span>
      <span class="distance-text-selected">${roundedShortestDistance} km</span>
    `;
    }

    const midpointSecondRoute = shortestRoute.directions[Math.floor(shortestRoute.directions.length / 2)];
    const distanceOverlaySecond = new Overlay({
      position: fromLonLat(midpointSecondRoute.point),
      element: distanceElementSecond,
      positioning: 'bottom-center',
      stopEvent: false,
    });

    mapRef.current.addOverlay(distanceOverlaySecond);
    setTimeout(function() {
      sessionStorage.setItem('isDistanceLayerAdded', 'true');
    }, 1000);

  }

  /* Rendering */
  // Main component
  return (
    <div className="popup popup--route" tabIndex={0}>
      <div className="popup__title">
        <p className="name">Your route</p>
      </div>

      <div className="popup__content">
        <RouteDetails route={fastestRoute} isPanel={true} isActive={activeIndex === 0} mapRef={mapRef} />
        <br/>
        <RouteDetails route={shortestRoute} isPanel={true} isActive={activeIndex === 1} mapRef={mapRef} />
      </div>
    </div>
  );
}
