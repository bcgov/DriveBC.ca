// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// Internal imports
import FriendlyTime from '../FriendlyTime';

// External assets
import { faMapLocation } from '@fortawesome/free-solid-svg-icons';

// Styling
import './EventCard.scss';

export default function EventCard(props) {
  // Props
  const { event, icon, showLoader } = props;

  // Rendering
  return (
    <div className={'event-card ' + (event ? event.severity.toLowerCase() : '')}>
      <div className="event-card__title">
        <div className="route">{ showLoader ? <Skeleton width={200} /> : event.route_display }</div>
        <div className="direction">{ showLoader ? <Skeleton width={30} /> : event.direction }</div>
      </div>

      <div className="event-card__details">
        <div className="type">
          <div className="header">{ showLoader ? <Skeleton /> : 'Type' }</div>
          <div className="content">
            { showLoader ? <Skeleton width={75} /> : <div>{icon} {event.severity.toLowerCase()}</div> }
          </div>
        </div>

        <div className="location">
          <div className="header">{ showLoader ? <Skeleton /> : 'Location' }</div>
          <div className="content">{ showLoader ? <Skeleton width={200} /> : event.location_description }</div>
        </div>

        <div className="closest-landmark">
          <div className="header">{ showLoader ? <Skeleton /> : 'Closest Landmark' }</div>
          <div className="content">
            { showLoader ? <Skeleton width={100} /> : (event.closest_landmark ? event.closest_landmark : '-')}
          </div>
        </div>

        <div className="description">
          <div className="header">{ showLoader ? <Skeleton /> : 'Description' }</div>
          <div className="content">{ showLoader ? <Skeleton count={7} /> : event.description }</div>
        </div>

        <div className="last-update">
          <div className="header">{ showLoader ? <Skeleton /> : 'Last Updated' }</div>
          <div className="content">
            { showLoader ? <Skeleton width={'90%'} /> : <FriendlyTime date={event.last_updated} /> }
          </div>
        </div>

        <div className="next-update">
          <div className="header">{ showLoader ? <Skeleton /> : 'Next Update' }</div>
          <div className="content">
            { showLoader ? <Skeleton width={'90%'} /> : <FriendlyTime date={event.next_update} /> }
          </div>
        </div>

        <div className="map">
          <div className="header">{ showLoader ? <Skeleton /> : 'Map' }</div>
          <div className="content">
            { showLoader ? <Skeleton width={30} /> : <FontAwesomeIcon icon={faMapLocation} /> }
          </div>
        </div>
      </div>
    </div>
  );
}
