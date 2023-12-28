// React
import React from 'react';

// Third party packages
import Button from 'react-bootstrap/Button';
import EventTypeIcon from '../EventTypeIcon';
import FriendlyTime from '../FriendlyTime';
import parse from 'html-react-parser';

import colocatedCamIcon from '../../images/colocated-camera.svg';

const displayCategoryMap = {
  closures: 'Closure',
  majorEvents: 'Major Delay',
  minorEvents: 'Minor Delay',
  futureEvents: 'Future Delay',
  roadConditions: 'Road Condition',
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

function renderCamGroup(camFeature, setClickedCamera, currentCamData) {
  const rootCamData = camFeature.ol_uid ? camFeature.getProperties() : camFeature;

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

export function getCamPopup(camFeature, setClickedCamera, navigate, cameraPopupRef, isPreview) {
  const rootCamData = camFeature.id ? camFeature : camFeature.getProperties();
  const camData = !rootCamData.groupIndex ? rootCamData : rootCamData.camGroup[rootCamData.groupIndex];

  const handlePopupClick = (e) => {
    if (!cameraPopupRef.current && !isPreview) {
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
  const eventData = eventFeature.ol_uid ? eventFeature.getProperties() : eventFeature;
  const severity = eventData.severity.toLowerCase();

  return (
    <div className={`popup popup--delay ${severity}`}>
      <div className="popup__title">
        <p className="bold name">{`${eventData.route_at} - ${eventData.route_display}`}</p>
        <p style={{'whiteSpace': 'pre-wrap'}} className="bold orientation">{convertDirection(eventData.direction)}</p>
      </div>

      <div className="popup__description">
        <div className="delay-type">
          <div className="bold delay-severity">
            <div className="delay-icon">
              <EventTypeIcon displayCategory={ eventData.display_category} />
            </div>

            <p className="bold">{ displayCategoryMap[eventData.display_category]}</p>
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
