// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/pro-solid-svg-icons';
import Skeleton from 'react-loading-skeleton'
import Button from 'react-bootstrap/Button';
import parse from "html-react-parser";

// Internal imports
import { getTypeDisplay, getSeverityClass } from './functions';
import FriendlyTime from '../shared/FriendlyTime';
import EventTypeIcon from '../events/EventTypeIcon';

// Styling
import './EventCard.scss';
import 'react-loading-skeleton/dist/skeleton.css'

export default function EventCard(props) {
  // Props
  const { event, showLoader, handleRoute, childRef, trackedEvents } = props;

  // Rendering
  const isHighlighted = event ? trackedEvents[event.id]?.highlight : null;

  return (
    <div
      className={'event-card ' + (event ? getSeverityClass(event).toLowerCase() : '') + ((event && isHighlighted) ? ' highlighted' : '')}
      data-key={event ? event.id : ''}
    >
      <div ref={childRef} className="event-card__title" data-key={event ? event.id : ''}>
        { showLoader ?
          <Skeleton width={75} /> :

          <div className="event-header">
            <div className="eventType">
              <EventTypeIcon event={event} state={event && event.severity === 'MINOR' && event.display_category !== 'chainUps' ? 'active' : 'static'} alt={true} />
              <span className="eventType__text">{getTypeDisplay(event)}</span>
            </div>

            {event && isHighlighted &&
              <div className="updated-pill">Updated</div>
            }
          </div>
        }
      </div>

      <div className="event-card__details">
        <div className="name">
          <div className="content">
            <div className="route">{ showLoader ? <Skeleton width={150} /> : event.route_at }</div>
            <div className="direction">{ showLoader ? <Skeleton width={100} /> : event.direction_display }</div>
          </div>
        </div>

        <div className="location">
          <div className="header">{ showLoader ? <Skeleton /> : 'Location' }</div>
          <div className="content">{ showLoader ? <Skeleton count={2} width={200} /> : event.location_description }</div>
        </div>

        <div className="closest-landmark">
          <div className="header">{ showLoader ? <Skeleton /> : 'Closest Landmark' }</div>
          <div className="content">
            { showLoader ? <Skeleton width={100} /> : (event.closest_landmark ? event.closest_landmark : '-')}
          </div>
        </div>

        <div className="description">
          <div className="header">{ showLoader ? <Skeleton /> : 'Description' }</div>
          <div className="content">{ showLoader ? <Skeleton count={5} /> : parse(event.optimized_description) }</div>
        </div>

        <div className="last-update">
          <div className="header">{ showLoader ? <Skeleton /> : 'Last Update' }</div>
          <div className="content">
            { showLoader ? <Skeleton width={'90%'} /> : <FriendlyTime date={event.last_updated} /> }
          </div>
        </div>

        {event && event.next_update &&
          <div className="next-update">
            <div className="header">{ showLoader ? <Skeleton /> : 'Next Update' }</div>
            <div className="content">
              { showLoader ? <Skeleton width={'90%'} /> : <FriendlyTime date={event.next_update} isNextUpdate={true} /> }
            </div>
          </div>
        }

        <div className="map">
          <div className="content">
            { showLoader ? <Skeleton width={30} /> :
            <Button
              className="viewOnMap-btn"
              aria-label="View on map"
              onClick={() => handleRoute(event)}
              onKeyDown={(keyEvent) => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  handleRoute(event);
                }
              }}>
              <FontAwesomeIcon icon={faLocationDot} />
              <span>View on map</span>
            </Button> }
          </div>
        </div>
      </div>
    </div>
  );
}
