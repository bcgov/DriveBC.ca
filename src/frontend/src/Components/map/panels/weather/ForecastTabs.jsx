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
  const { forecasts, timezone, showCards } = props;

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
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const getTabTitle = (forecast_group, index) => {
    // date from forecast weekday name, not sunset (rolls at UTC midnight)
    const [m, d, y] = new Date().toLocaleDateString('en-US', { timeZone: timezone, month: 'numeric', day: 'numeric', year: 'numeric' }).split('/');
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    for (let i = 0; i < 7; i++) {
      date.setUTCDate(date.getUTCDate() + 1);
      if (date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) === forecast_group[0].Period.TextForecastName) break;
    }

    // Get the month name and the day from the date
    const month = monthNames[date.getUTCMonth()];
    const day = String(date.getUTCDate()).padStart(2, '0');

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
