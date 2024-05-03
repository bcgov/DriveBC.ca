// React
import React from 'react';

import {
  getEventPopup,
  getFerryPopup,
  getWeatherPopup,
  getRegionalPopup,
  getRestStopPopup,
} from './mapPopup';
import CamPopup from './camPopup';

export const renderPanel = (clickedFeature, isCamDetail) => {
  if (clickedFeature) {
    switch (clickedFeature.get('type')) {
      case 'camera':
        return <CamPopup camFeature={clickedFeature} isCamDetail={isCamDetail} />;
      case 'event':
        return getEventPopup(clickedFeature);
      case 'ferry':
        return getFerryPopup(clickedFeature);
      case 'currentWeather':
        return getWeatherPopup(clickedFeature);
      case 'regionalWeather':
        return getRegionalPopup(clickedFeature);
      case 'restStop':
        return getRestStopPopup(clickedFeature);
    }
  }
}

export const maximizePanel = (panelRef) => {
  if (panelRef.current.classList.contains('open')) {
    if (!panelRef.current.classList.contains('maximized')) {
      panelRef.current.classList.add('maximized');

    } else {
      panelRef.current.classList.remove('maximized');
    }
  }
}

export const togglePanel = (panelRef, resetClickedStates, clickedFeatureRef, updateClickedFeature) => {
  panelRef.current.classList.toggle('open');
  panelRef.current.classList.remove('maximized');
  if (!panelRef.current.classList.contains('open')) {
    resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
  }
}
