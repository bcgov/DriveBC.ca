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
  const isLocalFormat = (forecast) => typeof forecast.Period === 'string';
  const transformPeriod = (period) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    if (period.toLowerCase().includes('night')) {
      if (period.toLowerCase().includes(today.toLowerCase())) {
        return 'Tonight';
      }
      return period;
    } else {
      if (period.toLowerCase().includes('afternoon')) {
        return 'Afternoon';
      }
      return 'Day';
    }
  };
  const getTemperatureText = (text) => {
    if ((text || '').endsWith('.')) {
      return text.slice(0, -1);
    }

    return text;
  }

  const carouselList = [];
  for (const [index, forecast] of forecast_group.entries()) {
    const isLocal = isLocalFormat(forecast);
    const period = isLocal ? forecast.Period : forecast.Period.TextForecastName;
    const displayPeriod = isLocal ? transformPeriod(forecast.Period) : period;
    const code = isLocal ? forecast.Code : forecast.AbbreviatedForecast.IconCode.Code;

    // Split by "High:" or "Low:" and take the first part
    const LocalText = forecast.Text;
    const highIndex = LocalText?.toLowerCase().indexOf('high:') ?? -1;
    const lowIndex = LocalText?.toLowerCase().indexOf('low:') ?? -1;
    // Find the earliest occurrence
    const minIndex = Math.min(
      highIndex === -1 ? Infinity : highIndex,
      lowIndex === -1 ? Infinity : lowIndex
    );
    const result = minIndex === Infinity 
      ? LocalText 
      : LocalText.substring(0, minIndex).trim();
      
    const text = isLocal ? result: forecast.TextSummary;
    
    let temperature = null;
    let showTemperature = true;
    
    if (isLocal) {
      const tempValue = index === 0 ? forecast.High : forecast.Low;
      temperature = tempValue !== undefined ? Math.round(tempValue) : null;
      showTemperature = forecast.High !== undefined || forecast.Low !== undefined;
    } else {
      temperature = getTemperatureText(forecast.Temperatures.Temperature.Value);
    }
    
    const key = isLocal ? forecast.Period : forecast.Period.TextForecastName;
    
    carouselList.push(
      <div key={key} className={currentPane !== index ? 'inactive' : ''}>
        <header className="carousel-header-container">
          <p className="forecast-name">
            <WeatherIcon className="weather-icon" code={code} />
            {displayPeriod}
          </p>
          {showTemperature && (
            <p className="forecast-temp-text">
              {index === 0 ? "High of " : "Low of "}{temperature}&deg;
            </p>
          )}
        </header>
        <p className="forecast-text">{text}</p>
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
