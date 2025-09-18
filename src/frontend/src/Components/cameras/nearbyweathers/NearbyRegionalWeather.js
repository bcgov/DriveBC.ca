// React
import React, { useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
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
import ForecastCarousel from '../../map/panels/weather/ForecastCarousel';
import ForecastTabs from '../../map/panels/weather/ForecastTabs';
import FriendlyTime from '../../shared/FriendlyTime';
import WeatherIconThin from '../../map/WeatherIconThin';

// Styling
import './NearbyRegionalWeather.scss';
import ForecastCard from "../../map/panels/weather/ForecastCard";

export default function NearbyRegionalWeather(props) {
  /* Setup */
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  // Props
  const { weather } = props;

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

  // States
  const [expanded, setExpanded] = useState(false);

  /* Rendering */
  // Main component
  return (
    <div className="popup popup--weather popup--cam--weather--regional" tabIndex={0}>
      {weather.warnings && (
        <div className="popup__advisory">
          {weather.warnings.Events.map(event => {
            return (
              <div key={event.expirytime} className="event">
                <FontAwesomeIcon icon={faTriangleExclamation}/>
                <p className="advisory-title">{event.Description}</p>
                {event.Url &&
                  <p className="label link">
                    <a
                      alt="Environment Canada Details Link"
                      rel="noreferrer"
                      href={event.Url}>
                      Details
                    </a>
                  </p>
                }
              </div>
            );
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
        <div className="time-container">
          {weather.observed && <FriendlyTime date={weather.observed} asDate={true}/>}
        </div>

        <div className="popup__content__title">
          <div className="info-container">
            <p className="name">{weather.name}</p>

            {conditions.temperature_value &&
              <p className="temperature">
                {Math.round(conditions.temperature_value)}&deg;
              </p>
            }
          </div>

          <div className="icon-container">
            <div className="icon-content">
              <WeatherIconThin className="weather-icon" code={conditions.icon_code}/>
              <p className="weather">{conditions.condition ? conditions.condition : 'Partly Cloudy'}</p>
            </div>
          </div>
        </div>

        <div className="popup__content__forecasts">
          {weather.current_day_forecasts.length &&
            (!smallScreen ?
              <ForecastCard forecast_group={weather.current_day_forecasts}/> :
              <ForecastCarousel forecast_group={weather.current_day_forecasts} currentPane/>
            )
          }

          <ForecastTabs forecasts={weather.future_forecasts} sunset={weather.sunset} showCards={!smallScreen} />
        </div>
      </div>
    </div>
  );
}
