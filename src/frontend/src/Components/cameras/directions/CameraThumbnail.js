// React
import React, { useEffect, useRef, useState } from 'react';


// Internal imports
import { getCameraOrientation, getFullOrientation } from "../helper";
import trackEvent from "../../shared/TrackEvent";

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideoSlash } from '@fortawesome/pro-solid-svg-icons';

// Styling
import './CameraThumbnail.scss';

export default function CameraThumbnail(props) {

  const { thumbnailCamera, mainCamera, index, switchOrientation } = props;
  
  // Refs
  const imageRef = useRef(null);

  // States
  const [camData, setCamData] = useState(thumbnailCamera);
  const [updated, setUpdated] = useState(false);
  const stale = camData && camData.marked_stale;
  const delayed = camData && camData.marked_delayed;
  const unavailable = camData && !camData.is_on;

  // Effects
  useEffect(() => {
    if (camData.last_update_modified !== thumbnailCamera.last_update_modified) {
      updateCameraImage(thumbnailCamera);
      setCamData(thumbnailCamera);
    }
  }, [thumbnailCamera]);

  /* Helpers */
  const updateCameraImage = (newCamData) => {
    setUpdated(true);

    // Update the image src
    if (imageRef.current) {
      imageRef.current.src = `${newCamData.links.imageDisplay}?ts=${new Date(newCamData.last_update_modified).getTime()}`;
    }
  }

  // get camera state message
  const getStateMessage = () => {
    let statusMessage = '';
    
    if (unavailable) {
        statusMessage = 'Unavailable';
    }
    
    else if (stale){
      if (delayed) {
        statusMessage = 'Delayed';
      }
      else {
        statusMessage = 'Stale';
      }
    }

    if (updated) {
      statusMessage = 'Updated';
    }

    return (
      statusMessage &&
        <span
          className={'status-pill' + (stale ? ' stale' : '') + (delayed ? ' delayed' : '') + (unavailable ? ' unavailable' : '') + (updated ? ' updated' : '')}>
            {statusMessage}
        </span>
    )
  }

  /* Rendering */
  // Main component
  return (
    <div className={'camera-thumbnail orientation' + (mainCamera.id === camData.id ? ' current' : '') + (stale ? ' stale' : '') + (delayed ? ' delayed' : '') + (unavailable ? ' unavailable' : '') + (updated ? ' updated' : '')}
      key={camData.id}
      onClick={() => {
        if ((mainCamera.id !== camData.id) && updated) {
          setUpdated(false);
        }
        switchOrientation(index);
        trackEvent("click", "camera-details", "mobile-camera-orientation", camData.name);
      }}
      onKeyDown={keyEvent => {
        if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
          switchOrientation(index);
          trackEvent("click", "camera-details", "mobile-camera-orientation", camData.name);
        }
      }}>

      {unavailable && 
        <div className="overlay-unavailable">
          <FontAwesomeIcon className="icon" icon={faVideoSlash} />
        </div>
      }

      <img
        ref={imageRef}
        src={camData.links.imageDisplay}
        alt={camData.name}/>

      {getStateMessage()}

      <span
        aria-label={getCameraOrientation(camData.orientation)}
        className={'label' + (mainCamera.id === camData.id ? ' current' : '')}>

        {getFullOrientation(camData.orientation)}
      </span>
    </div>
  );
}