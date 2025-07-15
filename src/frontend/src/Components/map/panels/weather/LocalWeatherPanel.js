// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

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
import FriendlyTime from '../../../shared/FriendlyTime';
import ShareURLButton from '../../../shared/ShareURLButton';

// Styling
import './LocalWeatherPanel.scss';

// Main component
export default function LocalWeatherPanel(props) {
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  const { feature, showRouteObjs } = props;

  const weatherData = feature.getProperties();
  const now = new Date();
  const forecastData = (weatherData.hourly_forecast_group || [])
    .filter((forecast) => (
      forecast.ObservationTypeName === 'surfaceTemp' &&
      new Date(forecast.TimestampUtc) > now
    ));

  const [searchParams, setSearchParams] = useSearchParams();

  // useEffect hooks
  useEffect(() => {
    searchParams.set('type', 'localWeather');
    searchParams.set('id', weatherData.id);
    setSearchParams(searchParams);
  }, [feature]);

  return (
    <div className="popup popup--weather popup--weather--local" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faTemperatureHalf}/>
        </div>

        <div className="popup__title__name">
          <p className='name'>Local Weather</p>
          <ShareURLButton/>
        </div>

        <span className="sub-name">Weather Stations</span>
      </div>

      <div className="popup__content">
        <div className="popup__content__title">
        <p className="name">{weatherData.weather_station_name}</p>
          <p className="description">{weatherData.location_description}</p>
          <FriendlyTime date={weatherData.issuedUtc} asDate />
        </div>

        <div className="popup__content__description">
          {(weatherData.air_temperature || weatherData.road_temperature) && (
            <div className="temperatures">
              {weatherData.air_temperature && (
                <div className="temperature temperature--air">
                  <p className="label"><FontAwesomeIcon icon={faTemperatureHalf} /> Air</p>
                  <p className="data">{weatherData.air_temperature}&deg;</p>
                </div>
              )}

              {weatherData.road_temperature && (
                <div className="temperature temperature--road">
                  <p className="label"><FontAwesomeIcon icon={faRoad} /> Road</p>
                  <p className="data">{weatherData.road_temperature}&deg;</p>
                </div>
              )}
            </div>
          )}

          {(weatherData.elevation || weatherData.precipitation || weatherData.precipitation_stdobs ||
            weatherData.snow || weatherData.snow_stdobs || weatherData.average_wind || weatherData.maximum_wind) && (

            <div className="data-card-container">
              <p className="container-label">Conditions</p>

              <div className="data-card">
                {weatherData.elevation && (
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faMountain} />
                    </div>
                    <p className="label">Elevation</p>
                    <p className="data">{weatherData.elevation} m</p>
                  </div>
                )}

                {(weatherData.precipitation || weatherData.precipitation_stdobs) && (
                  <div className="data-card__row data-card__row group">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faDroplet} />
                    </div>
                    <div className="data-group">
                      {weatherData.precipitation && (
                        <div className="data-group__row">
                          <p className="label">Precipitation (last hour)</p>
                          <p className="data">{weatherData.precipitation}</p>
                        </div>
                      )}
                      {weatherData.precipitation_stdobs && (
                        <div className="data-group__row">
                          <p className="label">Precipitation (since 6am/6pm)</p>
                          <p className="data">{weatherData.precipitation_stdobs}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(weatherData.snow || weatherData.snow_stdobs) && (
                  <div className="data-card__row data-card__row group">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faSnowflake} />
                    </div>
                    <div className="data-group">
                      {weatherData.snow && (
                        <div className="data-group__row">
                          <p className="label">Snow (last hour)</p>
                          <p className="data">{weatherData.snow}</p>
                        </div>
                      )}
                      {weatherData.snow_stdobs && (
                        <div className="data-group__row">
                          <p className="label">Snow (since 6am/6pm)</p>
                          <p className="data">{weatherData.snow_stdobs}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(weatherData.average_wind || weatherData.maximum_wind) && (
                  <div className="data-card__row data-card__row group">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faWind} />
                    </div>
                    <div className="data-group">
                      {weatherData.average_wind && (
                        <div className="data-group__row">
                          <p className="label">Average wind</p>
                          <p className="data">{weatherData.wind_direction} {weatherData.average_wind}</p>
                        </div>
                      )}
                      {weatherData.maximum_wind && (
                        <div className="data-group__row">
                          <p className="label">Maximum wind</p>
                          <p className="data">{weatherData.maximum_wind}</p>
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

        <div className="popup__content__footer">
          <p>Temperatures displayed in Celsius (&deg;C) <br /></p>
          <p>
            Local weather is provided by local Ministry of Transportation and Transit weather stations. <br />
            {forecastData.length > 0 && <span>Forecasts courtesy of Weathernet.</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
