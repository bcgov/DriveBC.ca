// React
import React from 'react';

// Third party packages
import Button from 'react-bootstrap/Button';
import EventTypeIcon from '../EventTypeIcon';
import FriendlyTime from '../FriendlyTime';
import parse from 'html-react-parser';

import colocatedCamIcon from '../../images/colocated-camera.svg';

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

function renderCamGroup(camFeature, setClickedCamera, currentCamData) {
  const rootCamData = camFeature.getProperties();

  const clickHandler = (i) => {
    camFeature.setProperties({ groupIndex: i });
    setClickedCamera(camFeature);  // Trigger re-render
  }

  const res = Object.entries(rootCamData.camGroup).map(([index, cam]) => {
    return (
      <Button className={'camera-direction-btn' + ((currentCamData.orientation == cam.orientation) ? ' current' : '') }
       key={cam.id} onClick={(event) => {event.stopPropagation(); clickHandler(index)}}>
        {cam.orientation}
      </Button>
    );
  });

  return res;
}

export function getCamPopup(camFeature, setClickedCamera, navigate, cameraPopupRef) {
  const rootCamData = camFeature.getProperties();

  const camData = !rootCamData.groupIndex ? rootCamData : rootCamData.camGroup[rootCamData.groupIndex];

  const handlePopupClick = (e) => {
    if (!cameraPopupRef.current) {
      navigate(`/cameras/${camData.id}`);
      cameraPopupRef.current = null;
    }
  };

  return (
    <div className="popup popup--camera">
      <div onClick={handlePopupClick}>
        <div className="popup__title">
          <p className="bold name">{camData.name}</p>
          <p className="bold orientation">{camData.orientation}</p>
        </div>

        <div className="popup__description">
          <p>{parse(camData.caption)}</p>
          <div className="popup__camera-info">
            <div className="camera-orientations">
              <img className="colocated-camera-icon" src={colocatedCamIcon} role="presentation" alt="colocated cameras icon" />
              {renderCamGroup(camFeature, setClickedCamera, camData)}
            </div>
            <div className="camera-image">
              <img src={camData.links.imageSource} width='300' />

              <div className="timestamp">
                <p className="driveBC">Drive<span>BC</span></p>
                <FriendlyTime date={camData.last_update_modified} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function getEventPopup(eventFeature) {
  const eventData = eventFeature.getProperties();

  const severity = eventData.severity.toLowerCase();
  const eventType = eventData.event_type.toLowerCase();

  return (
    <div className={`popup popup--delay ${severity}`}>
      <div className="popup__title">
        <p className="bold name">{`${eventData.route_at} - ${eventData.route_display}`}</p>
        <p style={{'white-space': 'pre-wrap'}} className="bold orientation">{convertDirection(eventData.direction)}</p>
      </div>

      <div className="popup__description">
        <div className="delay-type">
          <div className="bold delay-severity">
            <div className="delay-icon">
              <EventTypeIcon eventType={eventType} />
            </div>

            <p className="bold">{severity} delays</p>
          </div>

          <p className="bold friendly-time--mobile">
            <FriendlyTime date={eventData.last_updated} />
          </p>
        </div>

        <div className="delay-details">
          <p className="bold friendly-time-desktop">
            <FriendlyTime date={eventData.last_updated} />
          </p>

          <p>{eventData.description}</p>
        </div>
      </div>
    </div>
  );
}

export function getFerryPopup(ferryFeature) {
  const ferryData = ferryFeature.getProperties();

  return (
    <div className={`popup popup--ferry`}>
      <div className="popup__title">
        <a href={ferryData.url} target="_blank" rel="noreferrer" className="bold name">{`${ferryData.title}`}</a>
      </div>

      <div className="popup__description">
        {ferryData.image_url &&
          <img src={ferryData.image_url} alt={ferryData.title} />
        }

        <div className="delay-details">
          <p>{parse(ferryData.description)}</p>
          <p>{parse(ferryData.seasonal_description)}</p>
          <p>{parse(ferryData.service_hours)}</p>
        </div>
      </div>
    </div>
  );
}
