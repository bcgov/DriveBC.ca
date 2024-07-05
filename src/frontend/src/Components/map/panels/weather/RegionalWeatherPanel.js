// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWind,
  faEye,
  faTriangleExclamation,
  faSunCloud,
} from '@fortawesome/pro-regular-svg-icons';

// Internal imports
import ForecastCarousel from './ForecastCarousel';
import ForecastTabs from './ForecastTabs';
import FriendlyTime from '../../../shared/FriendlyTime';
import ShareURLButton from '../../../shared/ShareURLButton';
import WeatherIconThin from '../../WeatherIconThin';

// Styling
import './RegionalWeatherPanel.scss';

// Main component
export default function RegionalWeatherPanel(props) {
  const { feature } = props;

  const weather = feature.getProperties();
  const conditions = weather.conditions;

  // Split forecast into current and future
  const current_day_forecasts = [];
  const future_forecasts = [];
  for (const forecast of weather.forecast_group) {
    if (forecast.Period.TextForecastName == 'Today' || forecast.Period.TextForecastName == 'Tonight') {
      current_day_forecasts.push(forecast);

    } else {
      future_forecasts.push(forecast);
    }

    weather.current_day_forecasts = current_day_forecasts;
    weather.future_forecasts = future_forecasts;
  }

  const [_searchParams, setSearchParams] = useSearchParams();

  // useEffect hooks
  useEffect(() => {
    setSearchParams(new URLSearchParams({ type: 'regionalWeather', id: weather.id }));
  }, [feature]);

  /* Main component */
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

        <div className="popup__content__description">
          <div className="temp-and-icon">
            { conditions.temperature_units &&
              <p className="temperature">
                { Math.round(conditions.temperature_value) }&deg;
                <p className="weather">{ conditions.condition ? conditions.condition : 'Partly Cloudy' }</p>
              </p>
            }

            { weather.station
              ? <WeatherIconThin className="weather-icon" code={conditions.icon_code} />
              : <p>Not observed</p>
            }
          </div>

          <p className="section-title">Current conditions</p>

          {(conditions.visibility_value || conditions.wind_speed_value) && (
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

        {weather.current_day_forecasts.length &&
          <ForecastCarousel forecast_group={weather.current_day_forecasts} currentPane />
        }

        <ForecastTabs forecasts={weather.future_forecasts} sunset={weather.sunset} />

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
          Temperatures displayed in Celcius (&deg;C) <br />

          Courtesy of&nbsp;

          <a alt="Environment Canada"
            target="_blank"
            rel="noreferrer"
            href="https://weather.gc.ca/canada_e.html">
            Environment Canada
          </a>
        </p>
      </div>

      <ShareURLButton />
    </div>
  );
}
