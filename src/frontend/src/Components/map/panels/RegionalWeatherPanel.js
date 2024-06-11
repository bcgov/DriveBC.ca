// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWind,
  faEye,
  faTriangleExclamation,
  faSunCloud,
} from '@fortawesome/pro-solid-svg-icons';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

// Internal imports
import FriendlyTime from '../../shared/FriendlyTime';
import WeatherIcon from '../WeatherIcon';

// Styling
import './RegionalWeatherPanel.scss';

// Main component
export default function RegionalWeatherPanel(props) {
  const { feature } = props;

  const weather = feature.getProperties();
  const conditions = weather.conditions;

  return (
    <div className="popup popup--regional-weather" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faSunCloud} />
        </div>
        <p className="name">Regional Weather</p>
      </div>
      { weather.warnings &&
        <div className="popup__advisory">
          { weather.warnings.Events.map(event => {
            return <div key={ event.expirytime } className="event">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <p className="advisory-title">{ event.Description }</p>
            </div>;
          })}

          <p className="label link">
            <a
              alt="Past 24 Hours"
              target="_blank"
              rel="noreferrer"
              href={ weather.warnings.Url }
            >Details</a></p>
        </div>
      }
      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{weather.name}</p>
          { weather.observed && <FriendlyTime date={weather.observed} asDate={true} /> }
        </div>

        <Tabs
          defaultActiveKey="current"
          id="regional-weather-tabs"
        >
          <Tab eventKey="current" title="Current">
            <div className="popup__content__description">
              { weather.station
                ? <WeatherIcon className="weather-icon" code={conditions.icon_code} />
                : <p>Not observed</p>
              }
              <p className="weather">{ conditions.condition }</p>

              { conditions.temperature_units &&
                <p className="temperature">
                  { Math.round(conditions.temperature_value) }
                  { conditions.temperature_units }
                </p>
              }

              { (conditions.visibility_value || conditions.wind_speed_value) && (
                <div className="data-card">
                  { conditions.visibility_value && (
                    <div className="data-card__row">
                      <div className="data-icon">
                        <FontAwesomeIcon className="icon" icon={faEye} />
                      </div>
                      <p className="label">Visibility</p>
                      <p className="data">
                        {Math.round(conditions.visibility_value)}&nbsp;
                        {conditions.visibility_units}
                      </p>
                    </div>
                  )}

                  { conditions.wind_speed_value &&
                    <div className="data-card__row">
                      <div className="data-icon">
                        <FontAwesomeIcon className="icon" icon={faWind} />
                      </div>
                      <p className="label">Wind</p>
                      <p className="data">&nbsp;
                        { conditions.wind_speed_value === "calm" ?
                          <span>calm</span> :
                          <span>
                            { conditions.wind_direction }&nbsp;
                            { Math.round(conditions.wind_speed_value) }&nbsp;
                            { conditions.wind_speed_units }
                            { conditions.wind_gust_value && (
                              <span><br />&nbsp;gusts&nbsp;
                                {Math.round(conditions.wind_gust_value)}
                                &nbsp;{conditions.wind_gust_units}
                              </span>
                            )}
                          </span>
                        }
                      </p>
                    </div>
                  }
                </div>
              )}

            </div>
          </Tab>
          <Tab eventKey="forecast" title="Forecast">
              <div>
                { weather.forecast_group.map((forecast, index) => {
                  return (
                    <div key={index} className="forecast">
                      <div>
                        <p className="period">{forecast.Period.TextForecastName}</p>
                        <p className="summary">{forecast.Temperatures.TextSummary}</p>
                      </div>
                      <div>
                        <WeatherIcon className="weather-icon" code={forecast.AbbreviatedForecast.IconCode.Code} />
                        <p className="description">{forecast.TextSummary}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Tab>
        </Tabs>
      </div>
      <div className="popup__additional">
        { weather.station &&
          <p className="label">
            <a
              alt="Past 24 Hours"
              target="_blank"
              rel="noreferrer"
              href={`https://weather.gc.ca/past_conditions/index_e.html?station=${weather.station}`}
            >Past 24 hours</a>
          </p>
        }
        <p className="label">
          Courtesy of &nbsp;
          <a
            alt="Environment Canada"
            target="_blank"
            rel="noreferrer"
            href="https://weather.gc.ca/canada_e.html"
          >Environment Canada</a></p>
      </div>
    </div>
  );
}
