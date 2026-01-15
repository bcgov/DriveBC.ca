// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
} from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import FriendlyTime from '../../shared/FriendlyTime';
import WeatherIcon from "../../map/WeatherIcon";

// Styling
import './NearbyHevWeather.scss';

// Main component
export default function NearbyHevWeather(props) {
  /* Setup */
  // Props
  const { weather } = props;

  /* Rendering */
  // Main component
  return (
    <div className="popup popup--weather popup--cam--weather--hef" tabIndex={0}>
      {weather.warnings && (
        <div className="popup__advisory">
          {weather.warnings.Events.map(event => {
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

      <div className="popup__content">
        <div className="popup__content__title">
          <p className="highway">{weather.hwyName}</p>
          <p className="name">{weather.hwyDescription}</p>
          {weather.issued_utc &&
            <FriendlyTime date={weather.issued_utc} asDate={true} />
          }
        </div>

        <div className="popup__content__forecasts">
          {weather.forecasts.map((forecast) => (
            <div className='forecast' key={forecast.label}>
              <div className='title'>
                <div className='icon'>
                  <WeatherIcon code={forecast.icon} />
                </div>
                <div className='label'>{forecast.label}</div>
              </div>
              <div className='summary'>{forecast.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
