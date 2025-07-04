// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire } from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";

// Styling
import './WildfirePanel.scss';

export default function WildfirePanel(props) {
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  const { wildfire, showRouteObjs } = props;

  /* Rendering */
  // Main component
  return wildfire && (
    <div className="popup popup--border-crossing" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFire}/>
        </div>

        <div className="popup__title__name">
          <p className='name'>Wildfire</p>
        </div>
      </div>

      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{wildfire.name}</p>
          <p className="size">Size {wildfire.size}</p>
          <p className="discovered">Discovered {wildfire.reported_date}</p>
          <p className="updated">Last updated {wildfire.modified_at}</p>
          <a className="url" href={wildfire.url} target="_blank" rel="noreferrer">View details</a>
        </div>

        <div className="popup__content__footer">
          <span>
            Courtesy of
            <a href="https://www2.gov.bc.ca/gov/content/safety/wildfire-status" target="_blank"
               rel="noreferrer">BC Wildfire Service</a>
          </span>
        </div>
      </div>
    </div>
  );
}
