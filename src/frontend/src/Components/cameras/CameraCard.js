// React
import React, { useCallback, useEffect, useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { pushFavCam, removeFavCam } from '../../slices/userSlice';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faXmark,
  faCircleInfo,
  faVideoSlash,
  faStar,
} from '@fortawesome/pro-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/pro-regular-svg-icons';
import Button from 'react-bootstrap/Button';
import FriendlyTime from '../shared/FriendlyTime';

// Internal imports
import { getCameraOrientation } from './helper.js';
import { addFavoriteCamera, deleteFavoriteCamera } from "../data/webcams";

// Styling
import './CameraCard.scss';

import colocatedCamIcon from '../../images/colocated-camera.svg';
import trackEvent from '../shared/TrackEvent.js';

export default function CameraCard(props) {
  /* Setup */
  const { cameraData } = props;
  const location = useLocation();

  // Redux
  const dispatch = useDispatch();
  const { favCams } = useSelector(useCallback(memoize(state => ({
    favCams: state.user.favCams
  }))));

  // States
  const [show, setShow] = useState(false);
  const [camera, setCamera] = useState(cameraData);
  // to be used for deletion, does not update
  const [camId] = useState(cameraData.id);

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

  const addCamera = async () => {
    addFavoriteCamera(camera.id, dispatch, pushFavCam);
  }

  const deleteCamera = async () => {
    // use un-updated id for deletion in my cameras page
    const id = location.pathname == '/my-cameras' ? camId : camera.id;
    deleteFavoriteCamera(id, dispatch, removeFavCam);
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
    <div className={`camera-card ${stale} ${delayed} ${unavailable}`}>
      <div className="camera-card__body" onClick={handleClick} onKeyDown={handleKeyDown} tabIndex={0}>
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
        <div className="card-img-timestamp">
          <p className="driveBC">
            Drive<span>BC</span>
          </p>
          <FriendlyTime date={camera.last_update_modified} asDate={true} />
        </div>
        
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
        <p className="camera-name bold">{camera.name}</p>
        <p className="label">{camera.caption}</p>
      </div>
      
      <div className="camera-card__tools">
        <button
          className="viewmap-btn"
          aria-label="View on map"
          onClick={handleViewOnMap}>
          <FontAwesomeIcon icon={faMapMarkerAlt} />
          <span>View on map</span>
        </button>

        {favCams != null &&
          <button
            className={`favourite-btn ${(favCams && favCams.includes(camera.id)) ? 'favourited' : ''}`}
            aria-label={`${(favCams && favCams.includes(camera.id)) ? 'Remove favourite' : 'Add favourite'}`}
            onClick={favCams && favCams.includes(camera.id) ? deleteCamera : addCamera}>

            {(favCams && favCams.includes(camera.id)) ? 
            (<React.Fragment><FontAwesomeIcon icon={faStar} /><span>Remove</span></React.Fragment>) :
            (<React.Fragment><FontAwesomeIcon icon={faStarOutline} /><span>Save</span></React.Fragment>) }
          </button>
        }
      </div>
    </div>
  );
}
