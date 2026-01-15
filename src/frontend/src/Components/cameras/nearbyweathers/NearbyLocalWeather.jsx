// React
import React from 'react';

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

// Internal imports
import FriendlyTime from '../../shared/FriendlyTime';

// Styling
import './NearbyLocalWeather.scss';

// Main component
export default function NearbyLocalWeather(props) {
  /* Setup */
  // Props
  const { weather } = props;

  /* Helpers */
  const now = new Date();
  const forecastData = (weather.hourly_forecast_group || []).filter((forecast) => (
    forecast.ObservationTypeName === 'surfaceTemp' &&
    new Date(forecast.TimestampUtc) > now
  ));

  /* Rendering */
  // Main component
  return (
    <div className="popup popup--weather popup--cam--weather--local" tabIndex={0}>
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

          {(weather.elevation || weather.precipitation || weather.precipitation_stdobs ||
            weather.snow || weather.snow_stdobs || weather.average_wind || weather.maximum_wind) && (

            <div className="data-card-container">
              <p className="container-label">Conditions</p>

              <div className="data-card">
                {weather.elevation && (
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faMountain} />
                    </div>
                    <p className="label">Elevation</p>
                    <p className="data">{weather.elevation} m</p>
                  </div>
                )}

                {(weather.precipitation || weather.precipitation_stdobs) && (
                  <div className="data-card__row data-card__row group">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faDroplet} />
                    </div>
                    <div className="data-group">
                      {weather.precipitation && (
                        <div className="data-group__row">
                          <p className="label">Precipitation (last hour)</p>
                          <p className="data">{weather.precipitation}</p>
                        </div>
                      )}
                      {weather.precipitation_stdobs && (
                        <div className="data-group__row">
                          <p className="label">Precipitation (since 6am/6pm)</p>
                          <p className="data">{weather.precipitation_stdobs}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(weather.snow || weather.snow_stdobs) && (
                  <div className="data-card__row data-card__row group">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faSnowflake} />
                    </div>
                    <div className="data-group">
                      {weather.snow && (
                        <div className="data-group__row">
                          <p className="label">Snow (last hour)</p>
                          <p className="data">{weather.snow}</p>
                        </div>
                      )}
                      {weather.snow_stdobs && (
                        <div className="data-group__row">
                          <p className="label">Snow (since 6am/6pm)</p>
                          <p className="data">{weather.snow_stdobs}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(weather.average_wind || weather.maximum_wind) && (
                  <div className="data-card__row data-card__row group">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faWind} />
                    </div>
                    <div className="data-group">
                      {weather.average_wind && (
                        <div className="data-group__row">
                          <p className="label">Average wind</p>
                          <p className="data">{weather.wind_direction} {weather.average_wind}</p>
                        </div>
                      )}
                      {weather.maximum_wind && (
                        <div className="data-group__row">
                          <p className="label">Maximum wind</p>
                          <p className="data">{weather.maximum_wind}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
