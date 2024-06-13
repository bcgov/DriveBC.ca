// React
import React from 'react';

// Internal imports
import AdvisoriesPanel from './AdvisoriesPanel';
import CamPanel from './CamPanel';
import EventPanel from './EventPanel';
import FerryPanel from './FerryPanel';
import LocalWeatherPanel from './weather/LocalWeatherPanel';
import RegionalWeatherPanel from './weather/RegionalWeatherPanel';
import RestStopPanel from './RestStopPanel';

// Styling
import './index.scss';

export const renderPanel = (clickedFeature, isCamDetail) => {
  if (clickedFeature) {
    // Hack to pass in advisories from clickedFeature
    if (!clickedFeature.get)
      return <AdvisoriesPanel advisories={clickedFeature} />;

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
      case 'restStop':
        return <RestStopPanel feature={clickedFeature} />;
    }
  }
}

export const maximizePanel = (panelRef) => {
  if (panelRef.current.classList.contains('open') &&
      !panelRef.current.classList.contains('maximized')) {
    panelRef.current.classList.add('maximized');
  }
}

export const togglePanel = (panelRef, resetClickedStates, clickedFeatureRef, updateClickedFeature) => {
  panelRef.current.classList.toggle('open');
  panelRef.current.classList.remove('maximized');
  if (!panelRef.current.classList.contains('open')) {
    resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
  }
}
