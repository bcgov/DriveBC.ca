// React
import React from 'react';

// Third party packages
import Button from 'react-bootstrap/Button';
import EventTypeIcon from '../EventTypeIcon';
import FriendlyTime from '../FriendlyTime';

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

function renderCamGroup(camFeature, setClickedCamera) {
  const rootCamData = camFeature.getProperties();

  const clickHandler = (i) => {
    camFeature.setProperties({ groupIndex: i });
    setClickedCamera(camFeature);  // Trigger re-render
  }

  const res = Object.entries(rootCamData.camGroup).map(([index, cam]) => {
    return (
      <Button key={cam.id} onClick={() => clickHandler(index)}>{cam.orientation}</Button>
    );
  });

  return res;
}

export function getCamPopup(camFeature, setClickedCamera) {
  const rootCamData = camFeature.getProperties();

  const camData = !rootCamData.groupIndex ? rootCamData : rootCamData.camGroup[rootCamData.groupIndex];
  return (
    <div className="popup popup--camera">
      <div className="popup__title">
        <p className="bold name">{camData.name}</p>
        <p className="bold orientation">{camData.orientation}</p>
      </div>

      <div className="popup__description">
        <p>{camData.caption}</p>
        <div className="camera-image">
          <img src={camData.links.imageSource} width='300' />

          <div className="timestamp">
            <p className="driveBC">Drive<span>BC</span></p>
            <FriendlyTime date={camData.last_update_modified} />
          </div>
        </div>
      </div>

      {renderCamGroup(camFeature, setClickedCamera)}
    </div>
  );
}

export function getEventPopup(feature) {
  const severity = feature.get('severity').toLowerCase();
  const eventType = feature.get('event_type').toLowerCase();

  return (
    <div className="popup popup--delay ${severity}">
      <div className="popup__title">
        <p className="bold name">${feature.get('route_display')}</p>
        <p className="bold orientation">${convertDirection(feature.get('direction'))}</p>
      </div>

      <div className="popup__description">
        <div className="delay-type">
          <div className="bold delay-severity">
            <div className="delay-icon">
              <EventTypeIcon eventType={eventType} />
            </div>

            <p className="bold">${severity} delays</p>
          </div>

          <p className="bold friendly-time--mobile">
            <FriendlyTime date={feature.get('last_updated')} />
          </p>
        </div>

        <div className="delay-details">
          <p className="bold friendly-time-desktop">
            <FriendlyTime date={feature.get('last_updated')} />
          </p>

          <p>${feature.get('description')}</p>
        </div>
      </div>
    </div>
  );
}
