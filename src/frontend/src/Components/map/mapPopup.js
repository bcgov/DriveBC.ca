// React
import React from 'react';

// Third party packages
import EventTypeIcon from '../EventTypeIcon';
import FriendlyTime from '../FriendlyTime';
import parse from 'html-react-parser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFerry } from '@fortawesome/free-solid-svg-icons';

import './mapPopup.scss';

function convertCategory(event) {
  switch(event.display_category) {
    case 'closures': 
      return 'Closure';
    case 'majorEvents':
      return event.event_type === 'INCIDENT' ? 'Major incident ' : 'Major delay';
    case 'minorEvents':
      return event.event_type === 'INCIDENT' ? 'Minor incident ' : 'Minor delay';
    case 'futureEvents':
      return event.severity === 'MAJOR' ? 'Major future event' : 'Minor future event';
      case 'roadConditions':
        return 'Road condition'
    default:
      return '';
  }
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
    <div className={`popup popup--event ${eventData.display_category} ${severity}`}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <EventTypeIcon event={eventData} state='active' />
        </div>
        {console.log(eventData)}
        <p className="name">{convertCategory(eventData)}</p>
      </div>
      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{`${eventData.route_at} - ${eventData.route_display}`}</p>
          <p className="direction">{convertDirection(eventData.direction)}</p>
        </div>
        <div className="popup__content__description">
          <FriendlyTime date={eventData.last_updated} />
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
