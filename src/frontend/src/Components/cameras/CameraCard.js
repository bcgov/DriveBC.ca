// React
import React, { useEffect, useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faXmark,
  faCircleInfo,
  faVideoSlash,
  faStar,
} from '@fortawesome/pro-solid-svg-icons';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import FriendlyTime from '../shared/FriendlyTime';

import { getCameraOrientation } from './helper.js';

// Styling
import './CameraCard.scss';

import colocatedCamIcon from '../../images/colocated-camera.svg';
import trackEvent from '../shared/TrackEvent.js';

export default function CameraCard(props) {
  // Props
  const { cameraData } = props;

  // States
  const [show, setShow] = useState(false);
  const [camera, setCamera] = useState(cameraData);

  // useEffect hooks
  useEffect(() => {
    setCamera(cameraData);
  }, [cameraData]);

  // Misc
  const navigate = useNavigate();

  // Handlers
  function handleClick() {
    navigate(`/cameras/${camera.id}`);
    window.snowplow('trackSelfDescribingEvent', {
      schema: 'iglu:ca.bc.gov.drivebc/action/jsonschema/1-0-0',
      data: {
        action: 'click',
        section: 'camera-list',
        category: 'camera',
        label: camera.name,
        sub_label: '',
      },
    });

    sessionStorage.setItem('scrollPosition', window.pageYOffset);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      handleClick();
    }
  }

  function handleViewOnMap() {
    const refCamData = { ...camera };
    refCamData.type = 'camera';

    navigate({
      pathname: '/',
      search: `?${createSearchParams({
        type: "camera",
        id: camera.id,
      })}`
    });

    window.snowplow('trackSelfDescribingEvent', {
      schema: 'iglu:ca.bc.gov.drivebc/action/jsonschema/1-0-0',
      data: {
        action: 'click',
        section: 'camera-list',
        category: 'Camera',
        label: camera.name,
        sub_label: 'View on Map Select',
      },
    });
  }

  function handleRemoveCamera() {
    console.log("to be implemented");
    const webCamId = `${createSearchParams({
      id: camera.id,
    })}`;
    const value = webCamId.split('=')[1];

    // alert(value);
    deleteCamera(value);

  }

  async function deleteCamera(cameraId) {
    // const url = `${window.API_HOST}/api/users/webcams/${cameraId}`;
    // try {
    //   const response = await fetch(url, {
    //     method: 'DELETE',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     credentials: 'include'
    //   });
  
    //   if (!response.ok) {
    //     throw new Error(`Error: ${response.statusText}`);
    //   }
  
    //   const result = await response.json();
    //   console.log('Camera deleted successfully:', result);
    //   return result;
    // } catch (error) {
    //   console.error('Error deleting the camera:', error);
    //   throw error;
    // }
  }

  function handleChildClick(e) {
    e.stopPropagation();
    setShow(!show);
  }

  // Rendering
  const stale = camera.marked_stale ? 'stale' : '';
  const delayed = camera.marked_delayed ? 'delayed' : '';
  const unavailable = camera.is_on ? '' : 'unavailable';

  return (
    <Card className={`webcam-card ${stale} ${delayed} ${unavailable}`}>
      <Card.Body onClick={handleClick} onKeyDown={handleKeyDown} tabIndex={0}>
        <p className="camera-name bold">{camera.name}</p>
        <div className="camera-orientations">
          <img
            className="colocated-camera-icon"
            src={colocatedCamIcon}
            role="presentation"
            alt="colocated cameras icon"
          />
          {camera.camGroup.map(cam => (
            <Button
              aria-label={getCameraOrientation(cam.orientation)}
              className={
                'camera-direction-btn' +
                (camera.orientation == cam.orientation ? ' current' : '')
              }
              key={cam.id}
              onClick={event => {
                event.stopPropagation();
                setCamera(cam);
                trackEvent('click', 'camera-list', 'camera', cam.name);
              }}>
              {cam.orientation}
            </Button>
          ))}
        </div>
        <div></div>
        {!unavailable && !delayed && !stale && (
          <div className="card-img-box">
            <img
              className="card-img"
              src={camera.links.imageDisplay}
              alt={camera.name}
            />
          </div>
        )}

        {!unavailable && stale && !delayed && (
          <div className="card-img-box">
            <img
              className="card-img"
              src={camera.links.imageDisplay}
              alt={camera.name}
            />
            <div className="card-notification">
              <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                <p>
                  Unable to retrieve latest image. Showing last image received.
                </p>
                <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
              </div>
              <div
                className={'card-pill' + (show ? ' bounce' : ' hidden')}
                onClick={handleChildClick}
                onKeyDown={keyEvent => {
                  if (keyEvent.keyCode == 13) {
                    handleChildClick();
                  }
                }}>
                <p>Stale</p>
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>
            </div>
          </div>
        )}

        {!unavailable && stale && delayed && (
          <div className="card-img-box">
            <img
              className="card-img"
              src={camera.links.imageDisplay}
              alt={camera.name}
            />
            <div className="card-notification">
              <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                <p>
                  Longer than expected delay, displaying last image received.
                </p>
                <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
              </div>
              <div
                className={'card-pill' + (show ? ' bounce' : ' hidden')}
                onClick={handleChildClick}
                onKeyDown={keyEvent => {
                  if (keyEvent.keyCode == 13) {
                    handleChildClick();
                  }
                }}>
                <p>Delayed</p>
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>
            </div>
          </div>
        )}

        {unavailable && (
          <div className="card-img-box">
            <div className="card-notification">
              <div className="card-pill">
                <p>Unavailable</p>
              </div>
            </div>
            <div className="unavailable-message">
              <FontAwesomeIcon icon={faVideoSlash} />
              <p>
                This traffic camera image is temporarily unavailable. Please
                check again later.
              </p>
            </div>
          </div>
        )}
        <div className="timestamp">
          <p className="driveBC">
            Drive<span>BC</span>
          </p>
          <FriendlyTime date={camera.last_update_modified} asDate={true} />
        </div>
        <p className="label">{camera.caption}</p>
      </Card.Body>

      <Button
        variant="primary"
        className="viewmap-btn"
        onClick={handleViewOnMap}>
        View on map
        <FontAwesomeIcon icon={faMapMarkerAlt} />
      </Button>
      <Button
        variant="primary"
        className="viewmap-btn"
        onClick={handleRemoveCamera}>
        Remove
        <FontAwesomeIcon icon={faStar} />
      </Button>
    </Card>
  );
}
