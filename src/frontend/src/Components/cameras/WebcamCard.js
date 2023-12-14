// React
import React, { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom';

// Third party packages
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMapMarkerAlt} from '@fortawesome/free-solid-svg-icons';
import {faXmark} from '@fortawesome/free-solid-svg-icons';
import {faCircleInfo} from '@fortawesome/free-solid-svg-icons';
import {faVideoSlash} from '@fortawesome/free-solid-svg-icons';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import FriendlyTime from '../FriendlyTime';

// Styling
import './WebcamCard.scss';

import colocatedCamIcon from '../../images/colocated-camera.svg';

export default function WebcamCard(props) {
  // Props
  const { cameraData } = props;

  // States
  const [show, setShow] = useState(false);
  const [camera, setCamera] = useState(cameraData);

  const stale = camera.marked_stale ? 'stale' : '';
  const delayed = camera.marked_delayed ? 'delayed' : '';
  const unavailable = camera.is_on ? '' : 'unavailable';

  // Misc
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/cameras/${camera.id}`);
    sessionStorage.setItem('scrollPosition', window.pageYOffset);
  }
  function handleViewOnMap() {
    navigate('/', {state: camera});
  }

  function handleChildClick(e) {
    e.stopPropagation();
    setShow(!show);
  }

  const lastUpdatedTime = new Date(camera.last_update_modified);

  function getLastUpdateDiff() {
    return Math.trunc((new Date() - lastUpdatedTime) / (1000 * 60));
  }

  const [, setLastUpdateMin] = useState(getLastUpdateDiff());

  useEffect(() => {
    const timer = setInterval(() => setLastUpdateMin(getLastUpdateDiff()), 60000);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  // Rendering
  return (
    <Card className={`webcam-card ${stale} ${delayed} ${unavailable}`}>
      <Card.Body onClick={handleClick}>
        <p className="camera-name bold">{camera.name}</p>
        <div className="camera-orientations">

          <img className="colocated-camera-icon" src={colocatedCamIcon} role="presentation" alt="colocated cameras icon" />
          {camera.camGroup.map((cam) =>
            <Button className={'camera-direction-btn' + ((camera.orientation == cam.orientation) ? ' current' : '') } key={cam.id} onClick={(event) => {event.stopPropagation(); setCamera(cam)}}>{cam.orientation}</Button>
          )}
        </div>
        <div>
      </div>
        {!unavailable && !delayed && !stale &&
          <div className="card-img-box">
            <img className="card-img" src={ camera.links.imageSource } alt={camera.name} />
          </div>
        }

        {!unavailable && stale && !delayed &&
          <div className="card-img-box">
            <img className="card-img" src={ camera.links.imageSource } alt={camera.name} />
            <div className="card-notification">
              <div className={'card-banner' + (show ? ' hidden' : ' bounce') }>
                <p>Unable to retrieve latest image. Showing last image received.</p>
                <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
              </div>
              <div className={'card-pill' + (show ? ' bounce' : ' hidden') } onClick={handleChildClick} >
                <p>Stale</p>
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>
            </div>
          </div>
        }

        {!unavailable && stale && delayed &&
          <div className="card-img-box">
            <img className="card-img" src={ camera.links.imageSource } alt={camera.name} />
            <div className="card-notification">
              <div className={'card-banner' + (show ? ' hidden' : ' bounce') }>
                <p>Longer than expected delay, displaying last image received.</p>
                <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
              </div>
              <div className={'card-pill' + (show ? ' bounce' : ' hidden') } onClick={handleChildClick} >
                <p>Delayed</p>
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>
            </div>
          </div>
        }

        {unavailable &&
          <div className="card-img-box">
            <div className="card-notification">
              <div className="card-pill">
                <p>Unavailable</p>
              </div>
            </div>
            <div className="unavailable-message">
              <FontAwesomeIcon icon={faVideoSlash} />
              <p>This traffic camera image is temporarily unavailable. Please check again later.</p>
            </div>
          </div>
        }
        <div className="timestamp">
          <p className="driveBC">Drive<span>BC</span></p>
          <FriendlyTime date={camera.last_update_modified} />
        </div>
        <p className="label">{camera.caption}</p>
      </Card.Body>

      <Button variant="primary" className="viewmap-btn" onClick={handleViewOnMap}>View on map<FontAwesomeIcon icon={faMapMarkerAlt} /></Button>
    </Card>
  );
}
