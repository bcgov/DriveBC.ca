// React
import React from 'react';

// External imports
import Linkify from 'linkify-react';

// Internal imports
import EventTypeIcon from '../../events/EventTypeIcon';
import FriendlyTime from '../../shared/FriendlyTime';

// Styling
import './EventPanel.scss';

// Helper functions
function convertCategory(event) {
  switch (event.display_category) {
    case 'closures':
      return 'Closure';
    case 'majorEvents':
      return event.event_type === 'INCIDENT'
        ? 'Major incident '
        : 'Major delay';
    case 'minorEvents':
      return event.event_type === 'INCIDENT'
        ? 'Minor incident '
        : 'Minor delay';
    case 'futureEvents':
      if (event.severity === 'CLOSURE') {
        return 'Future closure event';
      } else if (event.severity === 'MAJOR') {
        return 'Major future event';
      }
      return 'Minor future event';
    case 'roadConditions':
      return 'Road condition';
    default:
      return '';
  }
}

function convertDirection(direction) {
  switch (direction) {
    case 'N':
      return 'Northbound';
    case 'W':
      return 'Westbound';
    case 'E':
      return 'Eastbound';
    case 'S':
      return 'Southbound';
    case 'BOTH':
      return 'Both Directions';
    case 'NONE':
      return ' ';
    default:
      return ' ';
  }
}

// Main component
export default function EventPanel(props) {
  const { feature } = props;

  const eventData = feature.ol_uid ? feature.getProperties() : feature;
  const severity = eventData.severity.toLowerCase();

  return (
    <div
      className={`popup popup--event ${eventData.display_category} ${severity}`} tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <EventTypeIcon event={eventData} state="active" />
        </div>
        <p className="name">{convertCategory(eventData)}</p>
      </div>

      <div className="popup__content">
        <div className="popup__content__title">
          <p className="direction">{convertDirection(eventData.direction)}</p>
          <p className="name">{eventData.highway_segment_names ? eventData.highway_segment_names : eventData.route_at}</p>
          <p className="location">{eventData.location_description}</p>
        </div>

        {eventData.closest_landmark &&
          <div className="popup__content__description">
            <p>Closest Landmark</p>
            <p>{eventData.closest_landmark}</p>
          </div>
        }

        <div className="popup__content__description">
          <p>Description</p>
          <p><Linkify>{eventData.optimized_description}</Linkify></p>
        </div>

        <div className="popup__content__block">
          <div className="popup__content__description last-update">
            <p>Last update</p>
            <FriendlyTime date={eventData.last_updated} />
          </div>

          {eventData.next_update &&
            <div className="popup__content__description next-update">
              <p>Next update</p>
              <FriendlyTime date={eventData.next_update} />
            </div>
          }
        </div>

        <div className="popup__content__description debug-data">
          <p onClick={() => console.log(eventData)}>{eventData.id}</p>
        </div>
      </div>
    </div>
  );
}
