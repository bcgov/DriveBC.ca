// React
import React from 'react';

// Internal imports
import WeatherIcon from '../../WeatherIcon';

// Styling
import './ForecastCard.scss';

export default function ForecastCard(props) {
  /* Setup */
  // Props
  const { forecast_group } = props;

  /* Rendering */
  // Subcomponents
  const getTemperatureText = (text) => {
    if ((text || '').endsWith('.')) {
      return text.slice(0, -1);
    }

    return text;
  }

  const getForecastCard = (forecast, index) => {
    return (
      <div key={forecast.Period.TextForecastName} className="forecast-card">
        <div className="header">
          <p className="forecast-name">
            <WeatherIcon className="weather-icon" code={forecast.AbbreviatedForecast.IconCode.Code}/>
            {forecast.Period.TextForecastName}
          </p>

          <p className="forecast-temp-text">
            {index == 0 ? "High of " : "Low of "}{getTemperatureText(forecast.Temperatures.Temperature.Value)}&deg;
          </p>
        </div>

        <p className="forecast-text-summary">{forecast.TextSummary}</p>
      </div>
    );
  }

  // Main component
  return (
    <div className="forecast-cards-container">
      {forecast_group.map((forecast, index) => getForecastCard(forecast, index))}
    </div>
  );
}
