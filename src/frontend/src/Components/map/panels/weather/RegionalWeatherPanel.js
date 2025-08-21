// React
import React, { useEffect, useState } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWind,
  faEye,
  faSunCloud,
  faChevronUp,
  faChevronDown,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faCircleInfo,
  faTriangleExclamation,
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";
import Collapse from 'react-bootstrap/Collapse';

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
  /* Setup */
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  // Props
  const { feature, showRouteObjs } = props;

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

  // Navigation
  const [searchParams, setSearchParams] = useSearchParams();

  // States
  const [expanded, setExpanded] = useState(false);

  // Effects
  useEffect(() => {
    searchParams.set('type', 'regionalWeather');
    searchParams.set('id', weather.id);
    setSearchParams(searchParams, { replace: true });
  }, [feature]);

  /* Rendering */
  // Main component
  return (
    <div className="popup popup--weather popup--weather--regional" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faSunCloud}/>
        </div>

        <div className="popup__title__name">
          <p className='name'>Regional Weather</p>
          <ShareURLButton />
        </div>
      </div>

      { weather.warnings && (
        <div className="popup__advisory">
          { weather.warnings.Events.map(event => {
            return <div key={ event.expirytime } className="event">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <p className="advisory-title">{ event.Description }</p>
              {event.Url && (
                <p className="label link">
                <a
                  alt="Environment Canada Details Link"
                  rel="noreferrer"
                  href={ event.Url }>
                  Details
                </a>
              </p>
              )}
            </div>;
          })}
        </div>
      )}

      {(!conditions.temperature_value || !weather.future_forecasts.length || !weather.current_day_forecasts.length) &&
        <div className="popup__info">
          <div className="event">
            <div>
              <FontAwesomeIcon icon={faCircleInfo} />
              <p className="advisory-title">Weather data incomplete</p>
            </div>

            <FontAwesomeIcon
              icon={expanded ? faChevronUp : faChevronDown}
              onClick={() => setExpanded(!expanded)}
              onKeyDown={(keyEvent) => {
                if (['Enter', 'NumpadEnter', 'Space'].includes(keyEvent.key)) {
                  setExpanded(!expanded);
                }
              }}
              tabIndex={0}
              aria-controls="collapse-text"
              aria-expanded={expanded}
              className="expand-toggle" />
          </div>

          <Collapse in={expanded}>
            <div id="collapse-text">
              We haven’t received complete data from Environment Canada. It could be because it hasn’t been observed or wasn’t transmitted.<br/><br/>
              For more information on why this might happen, read more on <a href="https://climate.weather.gc.ca/FAQ_e.html#Q4" rel="noreferrer">Environment Canada’s help page</a>
            </div>
          </Collapse>
        </div>
      }

      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{weather.name}</p>
          { weather.observed && <FriendlyTime date={weather.observed} asDate={true} /> }
        </div>

        <div className="popup__content__description">
          { conditions.temperature_value &&
            <div className="temp-and-icon">
              <p className="temperature">
                { Math.round(conditions.temperature_value) }&deg;
                <p className="weather">{ conditions.condition ? conditions.condition : 'Partly Cloudy' }</p>
              </p>

              <WeatherIconThin className="weather-icon" code={conditions.icon_code} />
            </div>
          }

          <p className="section-title">Current conditions</p>

          <div className="data-card">
            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon className="icon" icon={faEye} />
              </div>
              <p className="label">Visibility</p>
              { conditions.visibility_value ?
                <p className="data">
                  {Math.round(conditions.visibility_value)}&nbsp;
                  {conditions.visibility_units}
                </p> :

                <p className="data">Unavailable</p>
              }
            </div>

            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon className="icon" icon={faWind} />
              </div>
              <p className="label">Wind</p>

              { conditions.wind_speed_value ?
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
                </p> :

                <p className="data">Unavailable</p>
              }
            </div>
          </div>
        </div>

        <div className="popup__content__forecasts">
          {weather.current_day_forecasts.length &&
            <ForecastCarousel forecast_group={weather.current_day_forecasts} currentPane />
          }

          <ForecastTabs forecasts={weather.future_forecasts} sunset={weather.sunset} />
        </div>

        <div className="popup__content__additional">
          { weather.station &&
            <p className="label">
              <a
                alt="Past 24 Hours"
                rel="noreferrer"
                href={`https://weather.gc.ca/past_conditions/index_e.html?station=${weather.station}`}
              >Past 24 hours</a>
            </p>
          }

          <p className="label">
            Temperatures displayed in Celsius (&deg;C) <br />

            Courtesy of&nbsp;

            <a alt="Environment Canada"
              rel="noreferrer"
              href="https://weather.gc.ca/canada_e.html">
              Environment Canada
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
