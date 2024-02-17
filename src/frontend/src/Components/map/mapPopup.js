// React
import React from 'react';

// Third party packages
import EventTypeIcon from '../EventTypeIcon';
import FriendlyTime from '../FriendlyTime';
import parse from 'html-react-parser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFerry } from '@fortawesome/free-solid-svg-icons';

import './mapPopup.scss';

const displayCategoryMap = {
  closures: 'Closure',
  majorEvents: 'Major Delay',
  minorEvents: 'Minor Delay',
  futureEvents: 'Future Delay',
  roadConditions: 'Road Condition',
}

function convertDirection(direction) {
  switch (direction) {
      case "N":
          return "Northbound";
      case "W":
          return "Westbound";
      case "E":
          return "Eastbound";
      case "S":
          return "Southbound";
      case "BOTH":
          return "Both Directions";
      case "NONE":
          return " ";
      default:
          return " ";
  }
}

export function getEventPopup(eventFeature) {
  const eventData = eventFeature.ol_uid ? eventFeature.getProperties() : eventFeature;
  const severity = eventData.severity.toLowerCase();

  return (
    <div className={`popup popup--delay ${severity}`}>
      <div className="popup__title">
        <p className="bold name">{`${eventData.route_at} - ${eventData.route_display}`}</p>
        <p style={{'whiteSpace': 'pre-wrap'}} className="bold orientation">{convertDirection(eventData.direction)}</p>
      </div>

      <div className="popup__description">
        <div className="delay-type">
          <div className="bold delay-severity">
            <div className="delay-icon">
              <EventTypeIcon event={ eventData } />
            </div>

            <p className="bold">{ displayCategoryMap[eventData.display_category]}</p>
          </div>

          <div className="bold friendly-time--mobile">
            <FriendlyTime date={eventData.last_updated} />
          </div>
        </div>

        <div className="delay-details">
          <div className="bold friendly-time-desktop">
            <FriendlyTime date={eventData.last_updated} />
          </div>

          <p>{eventData.description}</p>
        </div>
      </div>
    </div>
  );
}

export function getFerryPopup(ferryFeature) {
  const ferryData = ferryFeature.getProperties();

  return (
    <div className="popup popup--ferry">
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFerry} />
        </div>
        <p className="name">
          <a href={ferryData.url} target="_blank" rel="noreferrer">{`${ferryData.title}`}</a>
        </p>
      </div>
      <div className="popup__content">
        {ferryData.image_url &&
          <div className="popup__content__image">
            <img src={ferryData.image_url} alt={ferryData.title} />
          </div>
        }

        <div className="popup__content__description">
          <p>{parse(ferryData.description)}</p>
          <p>{parse(ferryData.seasonal_description)}</p>
          <p>{parse(ferryData.service_hours)}</p>
        </div>
      </div>
    </div>
  );
}
