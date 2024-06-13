// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTemperatureHalf,
  faMountain,
  faDroplet,
  faSnowflake,
  faWind,
} from '@fortawesome/pro-solid-svg-icons';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

// Internal imports
import FriendlyTime from '../../../shared/FriendlyTime';

// Styling
import './LocalWeatherPanel.scss';

// Main component
export default function LocalWeatherPanel(props) {
  const { feature } = props;

  const weatherData = feature.getProperties();

  return (
    <div className="popup popup--road-weather" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faTemperatureHalf} />
        </div>
        <p className="name">Local Weather</p>
        <span className="sub-name">Weather Stations</span>
      </div>
      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{weatherData.weather_station_name}</p>
          <FriendlyTime date={weatherData.issuedUtc} />
          <p className="description">{weatherData.location_description}</p>
        </div>
        <Tabs
          defaultActiveKey="current"
          id="local-weather-tabs"
        >
          <Tab eventKey="current" title="Current">
            <div className="popup__content__description">
              { weatherData.road_condition && (
                <div className="road-condition">
                  <p className="data">{weatherData.road_condition}</p>
                  <p className="label">Road Condition</p>
                </div>
              )}

              {(weatherData.air_temperature || weatherData.road_temperature) && (
                <div className="temperatures">
                  {weatherData.air_temperature && (
                    <div className="temperature temperature--air">
                      <p className="data">{weatherData.air_temperature}</p>
                      <p className="label">Air</p>
                    </div>
                  )}
                  {weatherData.road_temperature && (
                    <div className="temperature temperature--road">
                      <p className="data">{weatherData.road_temperature}</p>
                      <p className="label">Road</p>
                    </div>
                  )}
                </div>
              )}
              <div className="data-card">
                {weatherData.elevation && (
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faMountain} />
                    </div>
                    <p className="label">Elevation</p>
                    <p className="data">{weatherData.elevation}</p>
                  </div>
                )}
                {weatherData.precipitation && (
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faDroplet} />
                    </div>
                    <p className="label">Precipitation (last 12 hours)</p>
                    <p className="data">{weatherData.precipitation}</p>
                  </div>
                )}
                {weatherData.snow && (
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon className="icon" icon={faSnowflake} />
                    </div>
                    <p className="label">Snow (last 12 hours)</p>
                    <p className="data">{weatherData.snow}</p>
                  </div>
                )}
                {(weatherData.average_wind ||
                  weatherData.maximum_wind) && (
                    <div className="data-card__row data-card__row group">
                      <div className="data-icon">
                        <FontAwesomeIcon className="icon" icon={faWind} />
                      </div>
                      <div className="data-group">
                        {weatherData.average_wind && (
                          <div className="data-group__row">
                            <p className="label">Average wind</p>
                            <p className="data">{weatherData.average_wind}</p>
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
          </Tab>
          {weatherData.hourly_forecast &&
            <Tab eventKey="forecast" title="Forecast">
              <div>
                <p>Road surface forecast</p>
                {weatherData.hourly_forecast.map((forecast, index) => {
                  return (
                    <div key={index} className="forecast">
                      <FriendlyTime date={forecast.time} asDate />
                      <p className="condition">{forecast.condition}</p>
                      <p className="temperature">{forecast.temp}&deg;C</p>
                    </div>
                  );
                })}
              </div>
            </Tab>
          }
        </Tabs>
      </div>
    </div>
  );
}
