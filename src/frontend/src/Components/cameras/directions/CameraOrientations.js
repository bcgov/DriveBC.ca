// React
import React from 'react';

// Internal imports
import { getCameraOrientation, getFullOrientation } from "../helper";

// Styling
import './CameraOrientations.scss';
import colocatedCamIcon from '../../../images/colocated-camera.svg';
import trackEvent from "../../shared/TrackEvent";

export default function CameraOrientations(props) {
  /* Setup */
  // Props
  const { camera, loadCamDetails } = props;

  // Handlers
  const rotateCameraOrientation = () => {
    const currentIndex = camera.camGroup.findIndex(cam => cam.id === camera.id);
    const nextIndex = (currentIndex + 1) % camera.camGroup.length;

    const nextCamera = camera.camGroup[nextIndex];
    loadCamDetails(nextCamera);
    trackEvent("click", "camera-details", "camera-rotate", nextCamera.name);
  };

  /* Rendering */
  // Main component
  return (
    <div className="camera-orientations-container">
      <div className="header">
        <img
          className="colocated-camera-icon"
          src={colocatedCamIcon}
          role="presentation"
          alt="colocated cameras icon"
          onClick={rotateCameraOrientation}
          style={{cursor: "pointer"}}
        />

        <span className="title">Direction</span>
      </div>

      <div className="main-content">
        {camera.camGroup.map(cam => (
          <div
            key={cam.id}
            className={'orientation' + (camera.id === cam.id ? ' current' : '')}
            onClick={() => {
              loadCamDetails(cam);
              trackEvent("click", "camera-details", "camera-orientation", cam.name);
            }}
            onKeyDown={keyEvent => {
              if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
              loadCamDetails(cam);
              trackEvent("click", "camera-details", "camera-orientation", cam.name);
            }}}>

            <img
              src={cam.links.imageDisplay}
              alt={cam.name} />

            <span
              aria-label={getCameraOrientation(cam.orientation)}
              className={'label' + (camera.id === cam.id ? ' current' : '')}>

              {getFullOrientation(cam.orientation)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
