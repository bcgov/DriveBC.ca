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
        <div className="popup__title__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="26" viewBox="0 0 22 26" fill="none">
            <path d="M16.7073 5.46153L16.4048 5.92308C15.5733 6.92308 14.8173 7.23077 13.7589 7.23077C12.0201 7.23077 10.6594 5.84616 10.6594 4V0C10.6594 0 0 5.61539 0 14.8697C0 21.1229 5.1407 26 10.8862 26C17.1414 26 21.9235 20.8461 21.9991 15.1539C22.0491 11.3849 20.0896 7.41388 16.7073 5.46153ZM10.9617 23.7692C9.405 23.7692 7.86228 22.6153 7.86228 20.6923C7.86228 19.5011 8.38291 18.9081 8.92068 18.3847L10.9617 16.3077L13.3809 18.6923C13.9045 19.2157 14.1368 20.0769 14.1368 20.9231C14.1368 22.2308 12.8518 23.7692 10.9617 23.7692ZM16.1024 22.1539C16.159 21.6445 16.8789 19.1124 14.9684 17.2308L10.9436 13.3077L7.03064 17.2308C5.10597 19.1265 5.76447 21.6728 5.82108 22.1539C4.98949 21.5384 3.47753 19.9231 2.94834 18.5384C2.45044 17.4405 2.11665 16.0753 2.11675 14.8697C2.11675 10 6.19907 5.61539 8.46703 4.07692C8.46703 5.46153 9.16533 7.07455 10.2058 8C11.2463 8.92545 12.3661 9.38255 13.7589 9.38461C14.8628 9.38461 16.0282 8.99295 16.934 8.38461C18.7484 9.92308 19.8076 12.5341 19.8067 14.8461C19.8823 18.1539 18.068 20.7692 16.1024 22.1539Z" fill="white"/>
          </svg>
        </div>

        <div className="popup__title__name">
          <p className='name'>Wildfire</p>
          <ShareURLButton />
        </div>
      </div>

      <div className="popup__content">
        <p className="popup__content__title">{wildfire.name}</p>

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
