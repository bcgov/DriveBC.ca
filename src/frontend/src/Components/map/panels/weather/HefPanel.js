// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMountain,
  faTriangleExclamation,
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";

// Internal imports
import FriendlyTime from '../../../shared/FriendlyTime';
import ShareURLButton from '../../../shared/ShareURLButton';
import WeatherIcon from '../../WeatherIcon';

// Styling
import './HefPanel.scss';

// Main component
export default function HefPanel(props) {
  /* Setup */
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  // Props
  const { feature, showRouteObjs } = props;

  const data = feature.getProperties();

  // Navigation
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    searchParams.set('type', 'hef');
    searchParams.set('id', data.id);
    setSearchParams(searchParams, { replace: true });
  }, [feature]);

  return (
    <div className="popup popup--weather popup--weather--hef" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
          <rect x="1" y="1" width="22" height="22" rx="3" stroke="#2D2D2D" strokeWidth="2"/>
          <path d="M12 7.0625C12.2578 7.0625 12.5156 7.21289 12.6445 7.42773L17.3066 14.8613C17.4355 15.0547 17.5 15.2695 17.5 15.5059C17.5 16.1504 16.9629 16.6875 16.2969 16.6875H7.68164C7.03711 16.6875 6.5 16.1504 6.5 15.5059C6.5 15.2695 6.56445 15.0547 6.67188 14.8613L11.334 7.42773C11.4629 7.21289 11.7207 7.0625 12 7.0625ZM13.3965 11.1875L12 8.97461L10.2812 11.6816L10.6895 12.1973C10.8184 12.3906 11.0977 12.3906 11.2266 12.1973L11.7852 11.4668C11.9141 11.2949 12.1074 11.1875 12.3438 11.1875H13.3965Z" fill="#2D2D2D"/>
        </svg>
          <p className='name'>High Elevation Weather</p>
        </div>
        <ShareURLButton/>
      </div>

      {data.warnings && (
        <div className="popup__advisory">
          {data.warnings.Events.map(event => {
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
          <p className="name">{data.hwyDescription}</p>
          <p className="highway">{data.hwyName}</p>
          { data.issued_utc && <FriendlyTime date={data.issued_utc} asDate={true} /> }
        </div>

        <div className="popup__content__forecasts">
          <p className="forecasts-title">Conditions</p>
          { data.forecasts.map((forecast) => (
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
        <div className="popup__content__additional">
          <p className="label">
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
