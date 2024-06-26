// React
import React, { useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import GoodCarousel from 'react-good-carousel';

// Internal imports
import WeatherIcon from '../../WeatherIcon';

// Styling
import './ForecastCarousel.scss';

// Main component
export default function ForecastCarousel(props) {
  const { forecast_group } = props;

  const [currentPane, setCurrentPane] = useState(0);

  /* Component helpers */
  const getTemperatureText = (text) => {
    if (text.endsWith('.')) {
      return text.slice(0, -1);
    }

    return text;
  }

  const carouselList = [];
  for (const [index, forecast] of forecast_group.entries()) {
    carouselList.push(
      <div key={forecast.Period.TextForecastName} className={currentPane !== index ? 'inactive' : ''}>
        <div className="carousel-header-container">
          <p className="forecast-name">
            <WeatherIcon className="weather-icon" code={forecast.AbbreviatedForecast.IconCode.Code} />
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

  /* Main component */
  return (
    <div className="carousel-container">
      <GoodCarousel
        className="current-forecast-carousel"
        currentPane={currentPane}
        itemsPerPane={1}
        gap={16}
        itemPeek={32}
        animationDuration={0.4}>

        {carouselList}
      </GoodCarousel>

      {currentPane !== carouselList.length - 1 && (
        <Button
          className="carousel-button next"
          onClick={() => setCurrentPane(currentPane + 1)}>
          <FontAwesomeIcon icon={faChevronRight} />
        </Button>
      )}

      {currentPane !== 0 && (
        <Button
          className="carousel-button prev"
          onClick={() => setCurrentPane(currentPane - 1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </Button>
      )}
    </div>
  );
}
