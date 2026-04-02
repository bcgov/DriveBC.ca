// React
import React from 'react';
import PropTypes from 'prop-types';

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
import CurrentWeatherIcon from '../../map/CurrentWeatherIcon';

// Styling
import './NearbyLocalWeather.scss';

// Main component
export default function NearbyLocalWeather(props) {
  /* Setup */
  // Props
  const { weather } = props;
  if (!weather) return null;

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

          {(weather.pavement_status || weather.pavement_grip || weather.elevation || weather.precipitation || weather.precipitation_stdobs || weather.snow || weather.snow_depth || weather.snow_stdobs || weather.average_wind || weather.maximum_wind) && (

            <div className="data-card-container">
              <p className="container-label">Current Conditions</p>

              <div className="data-card">
                {weather.present_weather && (
                  <div className="row--present-weather">
                    <div className="data-icon">
                      {weather.present_weather?.label && (
                        <CurrentWeatherIcon code={weather.present_weather.code} /> 
                      )}
                    </div>
                    <p className="container-label present-weather">
                      {weather.present_weather?.label || 'Unknown conditions'}
                    </p>
                  </div>
                )}

                {(weather.pavement_status || weather.pavement_grip) && (
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faRoad} />
                    </div>
                    <p className="label">Road condition</p>
                    <div className="data-group">
                      {weather.pavement_status && (
                        <p className="data">{weather.pavement_status}</p>
                      )}
                      {weather.pavement_grip && !(weather.pavement_status === "Icy" && weather.pavement_grip === "Icy") && (
                        <p className="data small">
                          {weather.pavement_grip}
                        </p>
                      )}
                    </div>
                  </div>
                )}

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
                          <div className="multi-line-label-group">
                            <p className="label">Precipitation</p>
                            <p className="label small">Last hour</p>
                          </div>
                          <p className="data">{weather.precipitation}</p>
                        </div>
                      )}
                      {weather.precipitation_stdobs && (
                        <div className="data-group__row">
                          <div className="multi-line-label-group">
                            <p className="label">Precipitation</p>
                            <p className="label small">Since 6am / 6pm</p>
                          </div>
                          <p className="data">{weather.precipitation_stdobs}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(weather.snow || weather.snow_stdobs || weather.snow_depth) && (
                  <div className="data-card__row data-card__row group">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faSnowflake} />
                    </div>
                    <div className="data-group">
                    {weather.snow && (
                        <div className="data-group__row">
                          <div className="multi-line-label-group">
                            <p className="label">Snow</p>
                            <p className="label small">Last hour</p>
                          </div>
                          <p className="data">{weather.snow}</p>
                        </div>
                      )}
                      {weather.snow_stdobs && (
                        <div className="data-group__row">
                          <div className="multi-line-label-group">
                            <p className="label">Snow</p>
                            <p className="label small">Since 6am / 6pm</p>
                          </div>
                          <p className="data">{weather.snow_stdobs}</p>
                        </div>
                      )}
                      {weather.snow_depth && (
                        <div className="data-group__row">
                          <div className="multi-line-label-group">
                            <p className="label">Roadside snow depth</p>
                          </div>
                          <p className="data">{weather.snow_depth}</p>
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

NearbyLocalWeather.propTypes = {
  weather: PropTypes.shape({
    weather_station_name: PropTypes.string,
    location_description: PropTypes.string,
    issuedUtc: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    air_temperature: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    road_temperature: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    elevation: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    precipitation: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    precipitation_stdobs: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    snow: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    snow_stdobs: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    average_wind: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maximum_wind: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    wind_direction: PropTypes.string,
    hourly_forecast_group: PropTypes.arrayOf(
      PropTypes.shape({
        ObservationTypeName: PropTypes.string,
        TimestampUtc: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        Value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      })
    ),
  }),
};
