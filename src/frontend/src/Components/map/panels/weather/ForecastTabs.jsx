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
import ForecastCard from "./ForecastCard";

// Main component
export default function ForecastTabs(props) {
  const { forecasts, sunset, showCards } = props;

  // Split forecasts into groups of day and night
  const all_forecast_groups = [];
  let current_group = [];
  for (const forecast of forecasts) {
    if (forecast.Period.TextForecastName.split(' ').length == 1) {
      // Day forecast, reset current_group
      current_group = [forecast];

    } else {
      // Night forecast, add to current_group and push to all groups
      current_group.push(forecast);
      all_forecast_groups.push(current_group);
    }
  }

  // Default active tab to first forecast group
  const [activeKey, setActiveKey] = useState(0);

  /* Component helpers */
  const getTabTitle = (forecast_group, index) => {
    // Parse the date string into a Date object
    const date = new Date(sunset);

    // Add a day to the date
    date.setDate(date.getDate() + (index + 1));

    // Define an array of month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Get the month name and the day from the date
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');

    return (
      <div className="tab-title">
        <WeatherIcon className="weather-icon" code={forecast_group[0].AbbreviatedForecast.IconCode.Code} />
        <div className={`date-display ${activeKey == index ? 'active' : ''}`}>{month} {day}</div>
        <div className="temp-display">
          <div className="active">{forecast_group[0].Temperatures.Temperature.Value}&deg;</div>
          <div>{forecast_group[1].Temperatures.Temperature.Value}&deg;</div>
        </div>
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
  return (
    <div className="forecast-tabs-container">
      <div className="forecast-container">
        <p className="section-title">5-day forecast</p>
      </div>

      <div className={`forecast-tab-list ${showCards ? 'show-cards' : ''}`}>
        <Tabs activeKey={activeKey} onSelect={(key) => setActiveKey(key)} id="regional-weather-tabs">
          {forecast_tabs}
        </Tabs>
      </div>

      {showCards ?
        <ForecastCard forecast_group={all_forecast_groups[activeKey]} /> :
        <ForecastCarousel forecast_group={all_forecast_groups[activeKey]} />
      }
    </div>
  );
}
