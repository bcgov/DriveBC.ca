// React
import React from 'react';

// Third party packages
import EventTypeIcon from '../EventTypeIcon';
import FriendlyTime from '../FriendlyTime';
import parse from 'html-react-parser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFerry,
  faTemperatureHalf,
  faMountain,
  faDroplet,
  faSnowflake,
  faWind
} from '@fortawesome/free-solid-svg-icons';

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

    // <div className="popup popup--road-weather">
    //   <div className="popup__title">
    //     <div className="popup__title__icon">
    //       <FontAwesomeIcon icon={faTemperatureHalf} />
    //     </div>
    //     <p className="name">Local Weather</p>
    //     <span className="sub-name">Weather Stations</span>
    //   </div>
    //   <div className="popup__content">
    //     <div className="popup__content__title">
    //       <p className="name">Trout Creek</p>
    //       <FriendlyTime date='2024-03-01T00:00:00-08:00' />
    //       <p className="description">Southside of Highway 15, 22km northwest of Smithers.</p>
    //     </div>
    //     <div className="popup__content__description">
    //       <div className="road-condition">
    //         <p className="data">Packed snow of 5cm</p>
    //         <p className="label">Road Condition</p>
    //       </div>
    //       <div className="temperatures">
    //         <div className="temperature temperature--air">
    //           <p className="data">17&#x2103;</p>
    //           <p className="label">Air</p>
    //         </div>
    //         <div className="temperature temperature--road">
    //           <p className="data">22&#x2103;</p>
    //           <p className="label">Road</p>
    //         </div>
    //       </div>
    //       <div className="data-card">
    //         <div className="data-card__row">
    //           <div className="data-icon">
    //             <FontAwesomeIcon className="icon" icon={faMountain} />
    //           </div>
    //           <p className="label">Elevation</p>
    //           <p className="data">410m</p>
    //         </div>
    //         <div className="data-card__row">
    //           <div className="data-icon">
    //             <FontAwesomeIcon className="icon" icon={faDroplet} />
    //           </div>
    //           <p className="label">Precipitation (last 12 hours)</p>
    //           <p className="data">240mm</p>
    //         </div>
    //         <div className="data-card__row">
    //           <div className="data-icon">
    //             <FontAwesomeIcon className="icon" icon={faSnowflake} />
    //           </div>
    //           <p className="label">Snow (last 12 hours)</p>
    //           <p className="data">240cm</p>
    //         </div>
    //         <div className="data-card__row data-card__row group">
    //           <div className="data-icon">
    //             <FontAwesomeIcon className="icon" icon={faWind} />
    //           </div>
    //           <div className="data-group">
    //             <div className="data-group__row">
    //               <p className="label">Average wind</p>
    //               <p className="data">SE 15 km/h</p>
    //             </div>
    //             <div className="data-group__row">
    //               <p className="label">Maximum wind</p>
    //               <p className="data">20 km/h</p>
    //             </div>
    //           </div>
    //         </div>

    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
}
