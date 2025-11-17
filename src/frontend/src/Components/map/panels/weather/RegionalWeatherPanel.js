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
  faTriangleExclamation,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faCircleInfo,
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
    searchParams.delete("display_category");
    setSearchParams(searchParams, { replace: true });
  }, [feature]);

  /* Rendering */
  // Main component
  return (
    <div className={`popup popup--weather popup--weather--regional` + (weather.warnings ? " advisory-issued" : "")} tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
          {weather.warnings ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
              <rect x="1" y="1" width="22" height="22" rx="3" stroke="#FCBA19" strokeWidth="2"/>
              <path d="M13.4609 6.04688C13.5781 6.09375 13.6719 6.1875 13.6953 6.32812L14.1641 8.83594L16.6719 9.30469C16.8125 9.32812 16.9062 9.42188 16.9531 9.53906C17 9.65625 17 9.79688 16.9297 9.89062L16.4609 10.5703C16.2734 10.5234 16.0625 10.5 15.875 10.5C15.1016 10.5 14.3984 10.8516 13.9297 11.3672C13.625 10.0312 12.4297 9 11 9C9.33594 9 8 10.3594 8 12C8 13.6641 9.33594 15 11 15C11.2812 15 11.5625 14.9766 11.8203 14.8828C12.1016 15.7969 12.9219 16.4766 13.9062 16.5L13.6953 17.6953C13.6719 17.8359 13.5781 17.9297 13.4609 17.9766C13.3438 18.0234 13.2031 18.0234 13.1094 17.9531L11 16.4766L8.86719 17.9531C8.77344 18.0234 8.63281 18.0234 8.51562 17.9766C8.39844 17.9297 8.30469 17.8359 8.28125 17.6953L7.83594 15.1641L5.30469 14.7188C5.16406 14.6953 5.07031 14.6016 5.02344 14.4844C4.97656 14.3672 4.97656 14.2266 5.04688 14.1328L6.52344 12L5.04688 9.89062C4.97656 9.79688 4.97656 9.65625 5.02344 9.53906C5.07031 9.42188 5.16406 9.32812 5.30469 9.30469L7.83594 8.83594L8.28125 6.32812C8.30469 6.1875 8.39844 6.09375 8.51562 6.04688C8.63281 6 8.77344 6 8.86719 6.07031L11 7.54688L13.1094 6.07031C13.2031 6 13.3438 6 13.4609 6.04688ZM13.25 12C13.25 12.0469 13.2266 12.0938 13.2266 12.1406C12.4062 12.4453 11.7969 13.2188 11.75 14.1328C11.5156 14.2266 11.2578 14.25 10.9766 14.25C9.73438 14.25 8.72656 13.2422 8.72656 12C8.72656 10.7578 9.73438 9.75 10.9766 9.75C12.2188 9.75 13.2266 10.7578 13.2266 12H13.25ZM14 15.75C13.1562 15.75 12.5 15.0938 12.5 14.25C12.5 13.4297 13.1562 12.75 14 12.75H14.0234C14.2109 11.9062 14.9609 11.25 15.875 11.25C16.6953 11.25 17.375 11.7891 17.6328 12.5156C17.8438 12.4453 18.0547 12.375 18.3125 12.375C19.2266 12.375 20 13.1484 20 14.0625C20 15 19.2266 15.75 18.3125 15.75H14Z" fill="#584215"/>
            </svg>
            ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
              <rect x="1" y="1" width="22" height="22" rx="3" stroke="#2D2D2D" strokeWidth="2"/>
              <path d="M12.7559 6.91797C12.8633 6.96094 12.9492 7.04688 12.9707 7.17578L13.4004 9.47461L15.6992 9.9043C15.8281 9.92578 15.9141 10.0117 15.957 10.1191C16 10.2266 16 10.3555 15.9355 10.4414L15.5059 11.0645C15.334 11.0215 15.1406 11 14.9688 11C14.2598 11 13.6152 11.3223 13.1855 11.7949C12.9062 10.5703 11.8105 9.625 10.5 9.625C8.97461 9.625 7.75 10.8711 7.75 12.375C7.75 13.9004 8.97461 15.125 10.5 15.125C10.7578 15.125 11.0156 15.1035 11.252 15.0176C11.5098 15.8555 12.2617 16.4785 13.1641 16.5L12.9707 17.5957C12.9492 17.7246 12.8633 17.8105 12.7559 17.8535C12.6484 17.8965 12.5195 17.8965 12.4336 17.832L10.5 16.4785L8.54492 17.832C8.45898 17.8965 8.33008 17.8965 8.22266 17.8535C8.11523 17.8105 8.0293 17.7246 8.00781 17.5957L7.59961 15.2754L5.2793 14.8672C5.15039 14.8457 5.06445 14.7598 5.02148 14.6523C4.97852 14.5449 4.97852 14.416 5.04297 14.3301L6.39648 12.375L5.04297 10.4414C4.97852 10.3555 4.97852 10.2266 5.02148 10.1191C5.06445 10.0117 5.15039 9.92578 5.2793 9.9043L7.59961 9.47461L8.00781 7.17578C8.0293 7.04688 8.11523 6.96094 8.22266 6.91797C8.33008 6.875 8.45898 6.875 8.54492 6.93945L10.5 8.29297L12.4336 6.93945C12.5195 6.875 12.6484 6.875 12.7559 6.91797ZM12.5625 12.375C12.5625 12.418 12.541 12.4609 12.541 12.5039C11.7891 12.7832 11.2305 13.4922 11.1875 14.3301C10.9727 14.416 10.7363 14.4375 10.4785 14.4375C9.33984 14.4375 8.41602 13.5137 8.41602 12.375C8.41602 11.2363 9.33984 10.3125 10.4785 10.3125C11.6172 10.3125 12.541 11.2363 12.541 12.375H12.5625ZM13.25 15.8125C12.4766 15.8125 11.875 15.2109 11.875 14.4375C11.875 13.6855 12.4766 13.0625 13.25 13.0625H13.2715C13.4434 12.2891 14.1309 11.6875 14.9688 11.6875C15.7207 11.6875 16.3438 12.1816 16.5801 12.8477C16.7734 12.7832 16.9668 12.7188 17.2031 12.7188C18.041 12.7188 18.75 13.4277 18.75 14.2656C18.75 15.125 18.041 15.8125 17.2031 15.8125H13.25Z" fill="#2D2D2D"/>
            </svg>
          )}
          {weather.warnings ? (
            <div className='name-div'>
              <p className='name'>Regional weather</p>
              <p className='label'>Advisory issued</p>
            </div>
            ) : (<p className='name'>Regional weather</p>
          )}
        </div>
        <ShareURLButton/>
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
