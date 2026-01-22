// Weather panels wrapper component
// Create this file at: src/Components/map/panels/weather/index.js

import React from 'react';
import LocalWeatherPanel from './LocalWeatherPanel';
import RegionalWeatherPanel from './RegionalWeatherPanel';
import HefPanel from './HefPanel';

const WeatherPanels = ({ type, ...props }) => {
  switch (type) {
    case 'local':
      return <LocalWeatherPanel {...props} />;
    case 'regional':
      return <RegionalWeatherPanel {...props} />;
    case 'hef':
      return <HefPanel {...props} />;
    default:
      return null;
  }
};

export default WeatherPanels;