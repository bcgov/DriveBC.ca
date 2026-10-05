// React
import React, { useCallback, useEffect, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft } from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import useEmblaCarousel from 'embla-carousel-react';

// Internal imports
import WeatherIcon from '../../WeatherIcon';

// Styling
import './ForecastCard.scss';

export default function ForecastCard(props) {
  /* Setup */
  // Props
  const { forecast_group } = props;
  const forecasts = forecast_group || [];

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    duration: 25,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const groupKey = forecasts.map((forecast) => forecast.Period.TextForecastName).join('|');

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    emblaApi.scrollTo(0);
  }, [emblaApi, groupKey]);

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
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {forecasts.map((forecast, index) => getForecastCard(forecast, index))}
        </div>
      </div>

      {canScrollNext && (
        <Button className="carousel-button next" onClick={scrollNext}>
          <FontAwesomeIcon icon={faChevronRight} />
        </Button>
      )}

      {canScrollPrev && (
        <Button className="carousel-button prev" onClick={scrollPrev}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </Button>
      )}
    </div>
  );
}
