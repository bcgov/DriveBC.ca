// React
import React, { useEffect, useRef, useState } from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// Third party packages
import Button from 'react-bootstrap/Button';
import FriendlyTime from '../FriendlyTime';
import parse from 'html-react-parser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideoSlash } from '@fortawesome/free-solid-svg-icons';

import colocatedCamIcon from '../../images/colocated-camera.svg';
import './camPopup.scss';

export default function CamPopup(props) {
  // Props
  const { camFeature, isPreview } = props;

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
  }, [camFeature]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setCamera(rootCam.camGroup[camIndex]);
  }, [camIndex]);

  // Handlers
  const handlePopupClick = (e) => {
    if (!isPreview) {
      navigate(`/cameras/${camera.id}`);
    }
  };

  // Rendering
  function renderCamGroup(currentCamData) {
    const clickHandler = (i) => {
      setCamIndex(i);  // Trigger re-render
    }

    const res = Object.entries(rootCam.camGroup).map(([index, cam]) => {
      return (
        <Button className={'camera-direction-btn' + ((camera.orientation == cam.orientation) ? ' current' : '') }
         key={cam.id} onClick={(event) => {event.stopPropagation(); clickHandler(index)}}>
          {cam.orientation}
        </Button>
      );
    });

    return res;
  }

  return (
    <div className="popup popup--camera">
      {camera &&
        <div onClick={handlePopupClick}>
          <div className="popup__title">
            <p className="bold name">{camera.name}</p>
            <p className="bold orientation">{camera.orientation}</p>
          </div>

          <div className="popup__description">
            <p>{parse(camera.caption)}</p>
            <div className="popup__camera-info">
              <div className="camera-orientations">
                <img className="colocated-camera-icon" src={colocatedCamIcon} role="presentation" alt="colocated cameras icon" />
                {renderCamGroup()}
              </div>
              {camera.is_on ?
                <div className="camera-image">
                  <img src={camera.links.imageSource} width='300' />
                  <div className="timestamp">
                    <p className="driveBC">Drive<span>BC</span></p>
                    <FriendlyTime date={camera.last_update_modified} />
                  </div>
                </div> :
                <div className='camera-image'>
                  <div className='camera-unavailable'>
                    <div className="card-pill">
                      <p>Unavailable</p>
                    </div>
                    <div className="card-img-box unavailable">
                      <FontAwesomeIcon icon={faVideoSlash} />
                    </div>
                    <p>This camera image is temporarily unavailable.  Please check again later.</p>
                  </div>
                  <div className="timestamp">
                    <p className="driveBC">Drive<span>BC</span></p>
                    <FriendlyTime date={camera.last_update_modified} />
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  );
}
