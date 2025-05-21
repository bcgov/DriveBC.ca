// React
import React, { useEffect, useRef, useState } from 'react';

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

  const carouselRef = useRef(null);

  const [currentPane, setCurrentPane] = useState(0);
  const [touchstartX, setTouchstartX] = useState(0);

  useEffect(() => {
    // Implements swiping for mobile/tablet devices
    if (!carouselRef.current) {
      return;
    }
    const carouselRefLocal = carouselRef;
    const onTouchStart = (e) => {
      setTouchstartX(e.changedTouches[0].screenX);
    };
    const onTouchEnd = (e) => {
      const touchendX = e.changedTouches[0].screenX;
      if (touchendX < touchstartX && currentPane !== carouselList.length - 1) {
        setCurrentPane(currentPane + 1);
      } else if (touchendX > touchstartX && currentPane !== 0) {
        setCurrentPane(currentPane - 1);
      }
    };
    carouselRefLocal.current.addEventListener("touchstart", onTouchStart);
    carouselRefLocal.current.addEventListener("touchend", onTouchEnd);

  }, [carouselRef, touchstartX]);

  /* Component helpers */
  const getTemperatureText = (text) => {
    if ((text || '').endsWith('.')) {
      return text.slice(0, -1);
    }

    return text;
  }

  const carouselList = [];
  for (const [index, forecast] of forecast_group.entries()) {
    carouselList.push(
      <div key={forecast.Period.TextForecastName} className={currentPane !== index ? 'inactive' : ''}>
        <header className="carousel-header-container">
          <p className="forecast-name">
            <WeatherIcon className="weather-icon" code={forecast.AbbreviatedForecast.IconCode.Code} />
            {forecast.Period.TextForecastName}
          </p>

          <p className="forecast-temp-text">
            {index == 0 ? "High of " : "Low of "}{getTemperatureText(forecast.Temperatures.Temperature.Value)}&deg;
          </p>
        </header>

        <p className="forecast-text-summary">{forecast.TextSummary}</p>
      </div>
    );
  }

  /* Main component */
  return (
    <div className="carousel-container" ref={carouselRef}>
      <GoodCarousel
        className="current-forecast-carousel"
        currentPane={currentPane}
        itemsPerPane={1}
        gap={16}
        itemPeek={12}
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
