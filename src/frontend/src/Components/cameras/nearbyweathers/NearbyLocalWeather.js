// React
import React, { useEffect } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDroplet,
  faMountain,
  faRoad,
  faSnowflake,
  faTemperatureHalf,
  faWind,
} from '@fortawesome/pro-light-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";

// Internal imports
import FriendlyTime from '../../shared/FriendlyTime';

// Styling
import './NearbyLocalWeather.scss';

// Main component
export default function NearbyLocalWeather(props) {
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  const { weather } = props;

  const now = new Date();
  const forecastData = (weather.hourly_forecast_group || [])
    .filter((forecast) => (
      forecast.ObservationTypeName === 'surfaceTemp' &&
      new Date(forecast.TimestampUtc) > now
    ));

  return (
    <div className="popup popup--weather popup--weather--local" tabIndex={0}>
      <div className="popup__content">
        <div className="popup__content__title">
        <p className="name">{weather.weather_station_name}</p>
          <p className="description">{weather.location_description}</p>
          <FriendlyTime date={weather.issuedUtc} asDate />
        </div>

        <div className="popup__content__description">
          {(weather.air_temperature || weather.road_temperature) && (
            <div className="temperatures">
              {weather.air_temperature && (
                <div className="temperature temperature--air">
                  <p className="label"><FontAwesomeIcon icon={faTemperatureHalf} /> Air</p>
                  <p className="data">{weather.air_temperature}&deg;</p>
                </div>
              )}

              {weather.road_temperature && (
                <div className="temperature temperature--road">
                  <p className="label"><FontAwesomeIcon icon={faRoad} /> Road</p>
                  <p className="data">{weather.road_temperature}&deg;</p>
                </div>
              )}
            </div>
          )}

          {forecastData.length > 0 &&
            <div className="data-card-container">
              <p className="container-label">Road surface forecast</p>

              <div className="data-card hourly-forecast">
                {forecastData.map((forecast, index) => (
                  <div key={index} className="data-card__row data-card__row group">
                    <FriendlyTime date={forecast.TimestampUtc} timeOnly />
                    <p className="temperature">{Math.round(forecast.Value)}&deg;</p>
                  </div>
                ))}
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
