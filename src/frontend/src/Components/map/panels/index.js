// React
import React from 'react';

// Internal imports
import AdvisoriesPanel from './AdvisoriesPanel';
import CamPanel from './CamPanel';
import EventPanel from './EventPanel';
import FerryPanel from './FerryPanel';
import LocalWeatherPanel from './weather/LocalWeatherPanel';
import RegionalWeatherPanel from './weather/RegionalWeatherPanel';
import HefPanel from './weather/HefPanel';
import RestStopPanel from './RestStopPanel';
import RouteDetailsPanel from './RouteDetailsPanel';
import BorderCrossingPanel from './BorderCrossingPanel';

// Styling
import './index.scss';
import Feature from "ol/Feature";

export const renderPanel = (clickedFeature, isCamDetail, smallScreen, mapView) => {
  if (clickedFeature) {
    // Hack for rendering advisories panel since it's not a feature
    // DBC22-2871: temporarily disabled
    // if (!clickedFeature.get) {
    //   return <AdvisoriesPanel advisories={clickedFeature} smallScreen={smallScreen} mapView={mapView}/>;
    // }

    switch (clickedFeature.get('type')) {
      case 'camera':
        return <CamPanel camFeature={clickedFeature} isCamDetail={isCamDetail} />;
      case 'event':
        return <EventPanel feature={clickedFeature} />;
      case 'ferry':
        return <FerryPanel feature={clickedFeature} />;
      case 'currentWeather':
        return <LocalWeatherPanel feature={clickedFeature} />;
      case 'regionalWeather':
        return <RegionalWeatherPanel feature={clickedFeature} />;
      case 'hef':
        return <HefPanel feature={clickedFeature} />;
      case 'largeRestStop':
      case 'restStop':
        return <RestStopPanel feature={clickedFeature} />;
      case 'borderCrossing':
        return <BorderCrossingPanel borderCrossing={clickedFeature.getProperties()} />;
      case 'advisory':
        return <AdvisoriesPanel advisories={[clickedFeature.get('data')]} />;
    }

  // Render searched routes panel if no feature is clicked
  } else {
    return <RouteDetailsPanel />;
  }
}

export const maximizePanel = (panelRef, clickedFeature) => {
  if (panelRef.current.classList.contains('open') &&
      !panelRef.current.classList.contains('maximized')) {
        // Prevent maximizing advisory and route panels on mobile view
        if (clickedFeature instanceof Feature){
          panelRef.current.classList.add('maximized');
        }
  }
}

export const togglePanel = (panelRef, resetClickedStates, clickedFeatureRef, updateClickedFeature, pushMargins, searchedRoutes) => {
  if (searchedRoutes) {
    panelRef.current.classList.remove('maximized');
    resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
    return;
  }

  panelRef.current.classList.toggle('open');
  panelRef.current.classList.remove('maximized');
  if (!panelRef.current.classList.contains('open')) {
    pushMargins.forEach((ref) => {
      if (ref.current) { ref.current.classList.remove('margin-pushed'); }
    })
    resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
  } else {
    pushMargins.forEach((ref) => {
      if (ref.current) { ref.current.classList.add('margin-pushed'); }
    })
  }
}
