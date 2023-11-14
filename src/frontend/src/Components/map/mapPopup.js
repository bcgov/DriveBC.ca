// React
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Third party packages
import FriendlyTime from '../FriendlyTime';
import EventTypeIcon from '../EventTypeIcon';

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
          return "";
      default:
          return "";
  }
}

export function getCamPopup(feature) {
  return `
    <div class="popup popup--camera">
      <div class="popup__title">
        <p class="bold name">${feature.name}
        <p class="bold orientation">${feature.orientation}</p>
      </div>

      <div class="popup__description">
        <p>${feature.caption}</p>
        <div class="camera-image">
          <img src="${feature.links.imageSource}" width='300'>

          <div class="timestamp">
            <p class="driveBC">Drive<span>BC</span></p>
            ` +
              ReactDOMServer.renderToString(
                <FriendlyTime date={feature.last_update_modified} />,
              ) +
            `
          </div>
        </div>
      </div>
    </div>
  `;
}

export function getEventPopup(feature) {
  const severity = feature.get('severity').toLowerCase();
  const eventType = feature.get('event_type').toLowerCase();

  return `
    <div class="popup popup--delay ${severity}">
      <div class="popup__title">
        <p class="bold name">${feature.get('route_at')}</p>
        <p class="bold orientation">${convertDirection(feature.get('direction'))}</p>
      </div>

      <div class="popup__description">
        <div class="delay-type">
          <div class="bold delay-severity">
            <div class="delay-icon">
              ` + ReactDOMServer.renderToString(
                <EventTypeIcon eventType={eventType} />,
              ) + `
            </div>

            <p class="bold">${severity} delays</p>
          </div>

          <p class="bold friendly-time--mobile">
            ` + ReactDOMServer.renderToString(
              <FriendlyTime date={feature.get('last_updated')} />,
            ) + `
          </p>
        </div>

        <div class="delay-details">
          <p class="bold friendly-time-desktop">
            ` + ReactDOMServer.renderToString(
              <FriendlyTime date={feature.get('last_updated')} />,
            ) + `
          </p>

          <p>${feature.get('description')}</p>
        </div>
      </div>
    </div>
  `;
}
