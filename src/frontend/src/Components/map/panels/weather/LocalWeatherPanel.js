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
    searchParams.delete("display_category");
    setSearchParams(searchParams, { replace: true });
  }, [feature]);

  return (
    <div className="popup popup--weather popup--weather--local" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
          <rect x="1" y="1" width="22" height="22" rx="3" stroke="#2D2D2D" strokeWidth="2"/>
          <path d="M12 7.75C11.4199 7.75 10.9688 8.22266 10.9688 8.78125V12.3262C10.9688 12.6914 10.7969 13.0137 10.625 13.2285C10.4102 13.5293 10.2812 13.8945 10.2812 14.2812C10.2812 15.248 11.0332 16 12 16C12.9453 16 13.7188 15.248 13.7188 14.2812C13.7188 13.8945 13.5684 13.5293 13.3535 13.25C13.1816 13.0137 13.0312 12.6914 13.0312 12.3262V8.78125C13.0312 8.22266 12.5586 7.75 12 7.75ZM9.59375 8.78125C9.59375 7.4707 10.668 6.375 12 6.375C13.3105 6.375 14.4062 7.4707 14.4062 8.78125V12.3262C14.4062 12.3477 14.4277 12.3691 14.4277 12.3906C14.8359 12.9277 15.0938 13.5723 15.0938 14.2812C15.0938 16 13.6973 17.375 12 17.375C10.2812 17.375 8.90625 16 8.90625 14.2812C8.90625 13.5723 9.14258 12.9277 9.55078 12.3906C9.57227 12.3691 9.57227 12.3477 9.57227 12.3477C9.57227 12.3262 9.59375 12.3262 9.59375 12.3262V8.78125ZM13.0312 14.2812C13.0312 14.8613 12.5586 15.3125 12 15.3125C11.4199 15.3125 10.9688 14.8613 10.9688 14.2812C10.9688 13.8516 11.248 13.4648 11.6562 13.3145V10.8438C11.6562 10.6719 11.8066 10.5 12 10.5C12.1719 10.5 12.3438 10.6719 12.3438 10.8438V13.3145C12.7305 13.4648 13.0312 13.8516 13.0312 14.2812Z" fill="#2D2D2D"/>
        </svg>
          <p className='name'>Local weather station</p>
        </div>
        <ShareURLButton/>
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
