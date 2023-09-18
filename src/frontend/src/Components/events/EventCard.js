import React from 'react';
// Styling
import './EventCard.scss';

// Third party packages
import FriendlyTime from '../FriendlyTime';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMapLocation} from '@fortawesome/free-solid-svg-icons';

export default function EventCard({event, icon}) {
  // Rendering
  return (
    <div className={'event-card ' + event.severity.toLowerCase()}>
      <div className="event-card__title">
        <div className="route">{event.route_display}</div>
        <div className="direction">{event.direction}</div>
      </div>
      <div className="event-card__details">
        <div className="type">
          <div className="header">Type</div>
          <div className="content"> {icon} {event.severity.toLowerCase()}</div>
        </div>
        <div className="description">
          <div className="header">Description</div>
          <div className="content">{event.description}</div>
        </div>
        <div className="last-update">
          <div className="header">Last Update</div>
          <div className="content"><FriendlyTime date={event.last_updated} /></div>
        </div>
        <div className="map">
          <div className="header">Map</div>
          <div className="content"><FontAwesomeIcon icon={faMapLocation} /></div>
        </div>
      </div>
    </div>
  );
}
