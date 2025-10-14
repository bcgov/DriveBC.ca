// React
import React, {useEffect} from 'react';

// Navigation
import { useSearchParams } from "react-router-dom";

// Internal imports
import ShareURLButton from '../../shared/ShareURLButton';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire,
  faEye
} from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";

// Styling
import './WildfirePanel.scss';

export default function WildfirePanel(props) {
  /* Setup */
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  const wildfireStatusDescriptions = {
    'wildfire of note': 'A wildfire that is creating an increased level of interest. We use this designation to make it easier to find and access response information on the wildfire map. A wildfire that is spreading or it is anticipated to spread beyond the current perimeter, or control line.',
    'out of control': 'A wildfire that is spreading or it is anticipated to spread beyond the current perimeter, or control line.',
    'being held': 'A wildfire that is projected, based on fuel and weather conditions and resource availability, to remain within the current perimeter, control line or boundary.',
    'under control': 'A wildfire that is not projected to spread beyond the current perimeter.',
  };

  const wildfireStatusClasses = {
    'wildfire of note': 'wildfire-status--note',
    'out of control': 'wildfire-status--out-of-control',
    'being held': 'wildfire-status--being-held',
    'under control': 'wildfire-status--under-control',
  };

  // Props
  const { wildfire, showRouteObjs } = props;

  // Navigation
  const [searchParams, setSearchParams] = useSearchParams();

  // Effects
  useEffect(() => {
    searchParams.set("type", 'wildfire');
    searchParams.set("id", wildfire.id);
    searchParams.delete("display_category");
    setSearchParams(searchParams, { replace: true });
  }, [wildfire]);

  /* Helpers */
  function getWildfireStatusDescription(status) {
    return wildfireStatusDescriptions[status.toLowerCase()] || '';
  }

  function getWildfireStatusClass(status) {
    return wildfireStatusClasses[status.toLowerCase()] || '';
  }

  const formatDate = (dateStr) => {
    // YYYY-MM-DD format
    const [year, month, day] = dateStr.split('-').map(Number);

    // Create array of month names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const ordinalSuffix = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${monthNames[month-1]} ${ordinalSuffix(day)}, ${year}`;
  };

  /* Rendering */
  // Main component
  return wildfire && (
    <div className="popup popup--wildfire" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
            <rect x="1" y="1" width="22" height="22" rx="3" stroke="#D8292F" strokeWidth="2"/>
            <path d="M15.1131 7.94083L14.9481 8.18935C14.4945 8.72781 14.0822 8.89349 13.5049 8.89349C12.5564 8.89349 11.8142 8.14793 11.8142 7.15385V5C11.8142 5 6 8.02367 6 13.0068C6 16.3739 8.80402 19 11.9379 19C15.3498 19 17.9582 16.2248 17.9995 13.1598C18.0268 11.1303 16.958 8.99209 15.1131 7.94083ZM11.9791 17.7988C11.13 17.7988 10.2885 17.1775 10.2885 16.142C10.2885 15.5006 10.5725 15.1813 10.8658 14.8994L11.9791 13.7811L13.2987 15.0651C13.5843 15.3469 13.711 15.8107 13.711 16.2663C13.711 16.9704 13.01 17.7988 11.9791 17.7988ZM14.7831 16.929C14.814 16.6547 15.2067 15.2913 14.1646 14.2781L11.9693 12.1657L9.8349 14.2781C8.78508 15.2989 9.14426 16.67 9.17513 16.929C8.72154 16.5976 7.89684 15.7278 7.60819 14.9822C7.3366 14.3911 7.15454 13.6559 7.15459 13.0068C7.15459 10.3846 9.38131 8.02367 10.6184 7.19526C10.6184 7.94083 10.9993 8.80937 11.5668 9.30769C12.1344 9.80601 12.7452 10.0521 13.5049 10.0533C14.107 10.0533 14.7427 9.84236 15.2367 9.51479C16.2264 10.3432 16.8041 11.7491 16.8036 12.9941C16.8449 14.7752 15.8552 16.1834 14.7831 16.929Z" fill="#D8292F"/>
          </svg>
          <p className='name'>Wildfire</p>
        </div>
        <ShareURLButton/>
      </div>

      <div className="popup__content">
        <p className="popup__content__title">{wildfire.name ? wildfire.name : wildfire.id}</p>

        <div className={`wildfire-status ${getWildfireStatusClass(wildfire.status)}`}>
          <p className="wildfire-status__title">{wildfire.status}</p>
          <p className="wildfire-status__description">{getWildfireStatusDescription(wildfire.status)}</p>
        </div>

        <div className="data-card">
          <div className="data-card__row">
            <div className="data-icon">
              <FontAwesomeIcon icon={faFire} />
            </div>
            <p className="label">Size</p>
            <p className="data">{wildfire.size} hectares</p>
          </div>
          <div className="data-card__row">
            <div className="data-icon">
              <FontAwesomeIcon icon={faEye} />
            </div>
            <p className="label">Discovered</p>
            <p className="data">{formatDate(wildfire.reported_date)}</p>
          </div>
        </div>

        <div className="popup__content__footer">
          <div className="url-btn" >
            <a href={wildfire.url} rel="noreferrer">View details</a>
          </div>
          <span>Courtesy of </span>
          <a href="https://www2.gov.bc.ca/gov/content/safety/wildfire-status" rel="noreferrer">BC Wildfire Service</a>
        </div>
      </div>
    </div>
  );
}
