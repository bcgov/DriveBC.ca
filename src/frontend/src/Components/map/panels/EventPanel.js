// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { useMediaQuery } from "@uidotdev/usehooks";
import Linkify from 'linkify-react';
import parse from "html-react-parser";

// Internal imports
import { getTypeDisplay, convertDirection } from '../../events/functions';
import EventTypeIcon from '../../events/EventTypeIcon';
import FriendlyTime from '../../shared/FriendlyTime';
import ShareURLButton from '../../shared/ShareURLButton';

// Styling
import './EventPanel.scss';

// Main component
export default function EventPanel(props) {
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  const { feature, showRouteObjs } = props;

  const [searchParams, setSearchParams] = useSearchParams();

  const eventData = feature.ol_uid ? feature.getProperties() : feature;
  const severity = eventData.severity.toLowerCase();

  // useEffect hooks
  useEffect(() => {
    const event = feature.getProperties();

    searchParams.set('type', 'event');
    searchParams.set('display_category', event.display_category);
    searchParams.set('id', event.id);
    setSearchParams(searchParams);
  }, [feature]);

  return (
    <div
      className={`popup popup--event ${eventData.display_category} ${severity}`} tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__icon">
          <EventTypeIcon event={eventData} state="active" />
        </div>

        <div className="popup__title__name">
          <p className="name">{getTypeDisplay(eventData)}</p>
          <ShareURLButton />
        </div>
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
          <p><Linkify>{parse(eventData.optimized_description)}</Linkify></p>
        </div>

        <div className="popup__content__block">
          <div className="popup__content__description last-update">
            <p>Last update</p>
            <FriendlyTime date={eventData.last_updated} timezone={eventData.timezone} />
          </div>

          {eventData.next_update &&
            <div className="popup__content__description next-update">
              <p>Next update</p>
              <FriendlyTime date={eventData.next_update} isNextUpdate={true} timezone={eventData.timezone} />
            </div>
          }
        </div>

        { eventData.display_category === 'chainUps' &&
          <div className="popup__content__description">
            <p>Who does this impact?</p>
            <p>
              <a
                href="https://www2.gov.bc.ca//gov/content/transportation/driving-and-cycling/traveller-information/seasonal/winter-driving/commercial"
                target="_blank"
                rel="noreferrer"
                alt="BC chain up requirements"
              >Chain up requirements</a> apply to a commercial
            vehicle with a weight of 11,794 Kg or greater.</p>
          </div>
        }

        <div className="popup__content__description debug-data">
          <p
            tabIndex={0}
            onClick={() => console.log(eventData)}
            onKeyPress={() => console.log(eventData)}
          >{eventData.id}</p>
        </div>
      </div>
    </div>
  );
}
