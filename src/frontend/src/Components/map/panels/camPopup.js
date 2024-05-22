// React
import React, { useEffect, useRef, useState } from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// Third party packages
import Button from 'react-bootstrap/Button';
import FriendlyTime from '../../shared/FriendlyTime';
import parse from 'html-react-parser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideoSlash, faVideo } from '@fortawesome/pro-solid-svg-icons';

import { getCameraOrientation } from '../../cameras/helper';

import colocatedCamIcon from '../../../images/colocated-camera.svg';
import './mapPopup.scss';
import trackEvent from '../../shared/TrackEvent';

export default function CamPopup(props) {
  // Props
  const { camFeature, isCamDetail } = props;

  // Misc
  const navigate = useNavigate();

  // Refs
  const isInitialMount = useRef(true);

  // useState hooks
  const newCam = camFeature.id ? camFeature : camFeature.getProperties();
  const [rootCam, setRootCam] = useState(newCam);
  const [camera, setCamera] = useState(newCam);
  const [camIndex, setCamIndex] = useState(0);

  // useEffect hooks
  useEffect(() => {
    const newCam = camFeature.id ? camFeature : camFeature.getProperties();
    setRootCam(newCam);
    setCamera(newCam);
    setCamIndex(0);
  }, [camFeature]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCamera(rootCam.camGroup[camIndex]);
  }, [camIndex]);

  // Handlers
  const handlePopupClick = e => {
    if (!isCamDetail) {
      navigate(`/cameras/${camera.id}`);
    }
  };

  // Rendering
  function renderCamGroup(currentCamData) {
    const clickHandler = i => {
      setCamIndex(i); // Trigger re-render
    };

    const res = Object.entries(rootCam.camGroup).map(([index, cam]) => {
      return (
        <Button
          aria-label={getCameraOrientation(cam.orientation)}
          className={
            'camera-direction-btn' +
            (camera.orientation == cam.orientation ? ' current' : '')
          }
          key={cam.id}
          onClick={event => {
            trackEvent('click', 'map', 'camera', cam.name);
            event.stopPropagation();
            clickHandler(index);
          }}>
          {cam.orientation}
        </Button>
      );
    });

    return res;
  }

  return (
    <div className="popup popup--camera">
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faVideo} />
        </div>
        <p className="name">Camera</p>
      </div>
      {camera && (
        <div className="popup__content">
          <div className="popup__content__title">
            <p
              className="name"
              onClick={handlePopupClick}
              onKeyDown={keyEvent => {
                if (keyEvent.keyCode == 13) {
                  handlePopupClick();
                }
              }}
              tabIndex={0}>
              {camera.name}
            </p>
          </div>
          {camera.is_on ? (
            <div className="popup__content__image">
              <div className="clip">
                <img src={camera.links.imageDisplay} width="300" />
              </div>
              <div className="timestamp">
                <p className="driveBC">
                  Drive<span>BC</span>
                </p>
                <FriendlyTime
                  date={camera.last_update_modified}
                  asDate={true}
                />
              </div>
            </div>
          ) : (
            <div className="popup__content__image">
              <div className="camera-unavailable">
                <div className="card-pill">
                  <p>Unavailable</p>
                </div>
                <div className="card-img-box unavailable">
                  <FontAwesomeIcon icon={faVideoSlash} />
                </div>
                <p>
                  This camera image is temporarily unavailable. Please check
                  again later.
                </p>
              </div>
              <div className="timestamp">
                <p className="driveBC">
                  Drive<span>BC</span>
                </p>
                <FriendlyTime
                  date={camera.last_update_modified}
                  asDate={true}
                />
              </div>
            </div>
          )}
          <div className="camera-orientations">
            <img
              className="colocated-camera-icon"
              src={colocatedCamIcon}
              role="presentation"
              alt="colocated cameras icon"
            />
            {renderCamGroup()}
          </div>
          <div className="popup__content__description">
            <p>{parse(camera.caption)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
