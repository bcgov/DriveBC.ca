// React
import React, { useState } from 'react';

// External imports
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

// Internal imports
import ForecastCarousel from './ForecastCarousel';
import WeatherIcon from '../../WeatherIcon';

// Styling
import './ForecastTabs.scss';

// Main component
export default function LocalForecastTabs(props) {
  const { forecasts, sunset, showCards } = props;
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Determine today's day name and filter
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const filteredForecasts = forecasts.filter((f, index) => {
    const forecastDay = f.Period.split(' ')[0];
    const todayIndex = dayOrder.indexOf(today);
    const forecastIndex = dayOrder.indexOf(forecastDay);
    const daysDiff = (forecastIndex - todayIndex + 7) % 7;
    
    return daysDiff <= 6 || index < 2;
  });

  // Group forecasts by day name
  const groupedByDay = {};
  for (const forecast of filteredForecasts) {
    const dayName = forecast.Period.split(' ')[0]; // "Monday", "Tuesday", etc.
    if (!groupedByDay[dayName]) {
      groupedByDay[dayName] = [];
    }
    groupedByDay[dayName].push(forecast);
  }
  
  const todayIndex = dayOrder.indexOf(today);
  const rotatedDayOrder = [...dayOrder.slice(todayIndex), ...dayOrder.slice(0, todayIndex)];
  const all_forecast_groups = rotatedDayOrder
    .filter(day => groupedByDay[day])
    .slice(0, 3)
    .map(day => groupedByDay[day]);

    // Default active tab to first forecast group
    const [activeKey, setActiveKey] = useState(0);

    /* Component helpers */
    const getTabTitle = (forecast_group, index) => {
      const title = forecast_group[0].Period.split(' ')[0];

      return (
        <div className="tab-title">
          <WeatherIcon className="weather-icon" code={forecast_group[0].Code} />
          <div className={`date-display ${activeKey == index ? 'active' : ''}`}>{title}</div>
        </div>
      );
    }

    const forecast_tabs = [];
    for (const [index, forecast_group] of all_forecast_groups.entries()) {
      forecast_tabs.push(
        <Tab eventKey={index} title={getTabTitle(forecast_group, index)} />
      );
    }

  /* Main component */
  return all_forecast_groups.length > 0 ? (
  <div className="forecast-tabs-container">
    <div className="forecast-container">
      <p className="section-title">3-day forecast</p>
    </div>
    <div className={`forecast-tab-list ${showCards ? 'show-cards' : ''}`}>
      <Tabs activeKey={activeKey} onSelect={(key) => setActiveKey(key)} id="local-weather-tabs">
        {forecast_tabs}
      </Tabs>
    </div>
    <ForecastCarousel forecast_group={all_forecast_groups[activeKey]} />
  </div>
) : null;
}
