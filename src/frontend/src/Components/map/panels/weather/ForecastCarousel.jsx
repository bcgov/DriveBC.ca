import React, { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft } from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import useEmblaCarousel from 'embla-carousel-react';
import WeatherIcon from '../../WeatherIcon';
import './ForecastCarousel.scss';

export default function ForecastCarousel(props) {
  const { forecast_group } = props;
  const [currentPane, setCurrentPane] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    duration: 25,
  });

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentPane(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const isLocalFormat = (forecast) => typeof forecast.Period === 'string';
  const transformPeriod = (period) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (period.toLowerCase().includes('night')) {
      return period.toLowerCase().includes(today.toLowerCase()) ? 'Tonight' : period;
    }
    return period.toLowerCase().includes('afternoon') ? 'Afternoon' : 'Day';
  };

  return (
    <div className={`carousel-container`}>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {forecast_group.map((forecast, index) => {
            const isLocal = isLocalFormat(forecast);
            const period = isLocal ? forecast.Period : forecast.Period.TextForecastName;
            const displayPeriod = isLocal ? transformPeriod(forecast.Period) : period;
            const code = isLocal ? forecast.Code : forecast.AbbreviatedForecast.IconCode.Code;
            const LocalText = forecast.Text || "";
            
            const highIndex = LocalText.toLowerCase().indexOf('high:');
            const lowIndex = LocalText.toLowerCase().indexOf('low:');
            const minIndex = [highIndex, lowIndex].filter(i => i !== -1);
            const splitPoint = minIndex.length > 0 ? Math.min(...minIndex) : LocalText.length;
            const text = isLocal ? LocalText.substring(0, splitPoint).trim() : forecast.TextSummary;

            let temperature = isLocal 
                ? (index === 0 ? forecast.High : forecast.Low)
                : forecast.Temperatures.Temperature.Value;
            
            if (temperature && typeof temperature === 'string') temperature = temperature.replace('.', '');

            return (
              <div key={index} className={`embla__slide ${currentPane !== index ? 'inactive' : ''}`}>
                <div className="slide-inner">
                  <header className="carousel-header-container">
                    <p className="forecast-name">
                      <WeatherIcon className="weather-icon" code={code} />
                      {displayPeriod}
                    </p>
                    <p className="forecast-temp-text">
                      {index === 0 ? "High of " : "Low of "}{Math.round(temperature)}&deg;
                    </p>
                  </header>
                  <p className="forecast-text">{text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {currentPane !== forecast_group.length - 1 && (
        <Button className="carousel-button next" onClick={scrollNext}>
          <FontAwesomeIcon icon={faChevronRight} />
        </Button>
      )}

      {currentPane !== 0 && (
        <Button className="carousel-button prev" onClick={scrollPrev}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </Button>
      )}
    </div>
  );
}