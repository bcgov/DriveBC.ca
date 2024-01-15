// React
import React from 'react';

// Third party packages
import Button from 'react-bootstrap/Button';
import FriendlyTime from '../FriendlyTime';
import parse from 'html-react-parser';

import colocatedCamIcon from '../../images/colocated-camera.svg';


function renderCamGroup(camFeature, setClickedCamera, currentCamData) {
  const rootCamData = camFeature.ol_uid ? camFeature.getProperties() : camFeature;

  const clickHandler = (i) => {
    console.log('test');
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

export default function CamPopup(props) {
  const { camFeature, setClickedCamera, navigate, cameraPopupRef, isPreview } = props;

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
