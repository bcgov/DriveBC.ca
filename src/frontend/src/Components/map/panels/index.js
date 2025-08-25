// React
import React from 'react';

// Internal imports
import AdvisoriesPanel from './AdvisoriesPanel';
import CamPanel from './CamPanel';
import CoastalFerryPanel from "./CoastalFerryPanel";
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
import WildfirePanel from "./WildfirePanel";

export const renderPanel = (
  clickedFeature,
  isCamDetail,
  smallScreen,
  mapView,
  clickedFeatureRef,
  updateClickedFeature,
  showRouteObjs,
  setShowRouteObjs
) => {
  if (clickedFeature) {
    // Hack for rendering advisories panel since it's not a feature
    // DBC22-2871: temporarily disabled
    // if (!clickedFeature.get) {
    //   return <AdvisoriesPanel advisories={clickedFeature} smallScreen={smallScreen} mapView={mapView}/>;
    // }

    switch (clickedFeature.get('type')) {
      case 'camera':
        return <CamPanel camFeature={clickedFeature} isCamDetail={isCamDetail} showRouteObjs={showRouteObjs} />;
      case 'event':
        return <EventPanel feature={clickedFeature} showRouteObjs={showRouteObjs} />;
      case 'ferry':
        if (clickedFeature.get('coastal')) {
          return <CoastalFerryPanel feature={clickedFeature} showRouteObjs={showRouteObjs} />;
        }

        return <FerryPanel feature={clickedFeature} showRouteObjs={showRouteObjs} />;
      case 'currentWeather':
        return <LocalWeatherPanel feature={clickedFeature} showRouteObjs={showRouteObjs} />;
      case 'regionalWeather':
        return <RegionalWeatherPanel feature={clickedFeature} showRouteObjs={showRouteObjs} />;
      case 'hef':
        return <HefPanel feature={clickedFeature} showRouteObjs={showRouteObjs} />;
      case 'largeRestStop':
      case 'restStop':
        return <RestStopPanel feature={clickedFeature} showRouteObjs={showRouteObjs} />;
      case 'borderCrossing':
        return <BorderCrossingPanel borderCrossing={clickedFeature.getProperties()} showRouteObjs={showRouteObjs} />;
      case 'advisory':
        return <AdvisoriesPanel advisories={clickedFeature.get('data')} showRouteObjs={showRouteObjs} inMap={true} />;
      case 'wildfire':
        return <WildfirePanel wildfire={clickedFeature.get('data')} showRouteObjs={showRouteObjs} />;
    }

  // Render searched routes panel if no feature is clicked
  } else {
    return (
      <RouteDetailsPanel
        clickedFeatureRef={clickedFeatureRef}
        updateClickedFeature={updateClickedFeature}
        showRouteObjs={showRouteObjs}
        setShowRouteObjs={setShowRouteObjs} />
    );
  }
}

export const resizePanel = (panelRef, clickedFeature, setMaximizedPanel) => {
  if (panelRef.current.classList.contains('open')){
    // Prevent maximizing advisory and route panels on mobile view
    if (clickedFeature instanceof Feature){
      if(!panelRef.current.classList.contains('maximized')) {
        panelRef.current.classList.add('maximized');
        setMaximizedPanel(true);

      } else {
        panelRef.current.classList.remove('maximized');
        setMaximizedPanel(false);
      }
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
