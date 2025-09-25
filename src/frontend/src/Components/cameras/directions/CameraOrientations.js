// React
import React, { useEffect, useRef, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
  faVideoSlash
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import GoodCarousel from 'react-good-carousel';

// Internal imports
import { getCameraOrientation, getFullOrientation } from "../helper";
import colocatedCamIcon from '../../../images/colocated-camera.svg';
import trackEvent from "../../shared/TrackEvent";

// Styling
import './CameraOrientations.scss';

export default function CameraOrientations(props) {
  /* Setup */
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');
  const inBetweenScreen = useMediaQuery('only screen and (min-width: 576px) and (max-width: 1199px)');
  const xXLargeScreen = useMediaQuery('only screen and (min-width : 1200px)');

  // Props
  const { camData, loadCamDetails } = props;

  // Refs
  const imageRef = useRef(null);

  // States
  const [camera, setCamera] = useState(camData);
  const showCompactLayout = (camera.camGroup.length > 2) && smallScreen;
  const showReducedLayout = (camera.camGroup.length > 3) && inBetweenScreen;
  const showFullLayout = (
    ((camera.camGroup.length < 3) && smallScreen) ||
    ((camera.camGroup.length < 4) && inBetweenScreen) ||
    xXLargeScreen
  );
  const perPane = showCompactLayout ? 2 : 3;

  const initialIndex = camData.camGroup.findIndex(cam => cam.id === camData.id);
  const [currentCamIndex, setCurrentCamIndex] = useState(initialIndex);
  const [currentPane, setCurrentPane] = useState(Math.floor(initialIndex / perPane));
  const [isUpdated, setIsUpdated] = useState(false);

  // Effects
  useEffect(() => {
    const nextCam = camera.camGroup[currentCamIndex];
    loadCamDetails(nextCam);
  }, [currentCamIndex]);

  useEffect(() => {
    if (camera.last_update_modified !== camData.last_update_modified) {
      updateCameraImage(camData);
    }

    setCamera(camData);
  }, [camData]);

  /* Helpers */
  const updateCameraImage = (cam) => {
    // Update the image src
    if (imageRef.current) {
      imageRef.current.src = `${cam.links.imageDisplay}?ts=${new Date(cam.last_update_modified).getTime()}`;
    }
  }

  /* Handlers */
  const rotateCameraOrientation = () => {
    const currentIndex = camera.camGroup.findIndex(cam => cam.id === camera.id);
    const nextIndex = (currentIndex + 1) % camera.camGroup.length;

    const nextCamera = camera.camGroup[nextIndex];
    loadCamDetails(nextCamera);
    trackEvent("click", "camera-details", "camera-rotate", nextCamera.name);
  };

  // Switch orientation for mobile carousel
  const switchOrientation = (index) => {
    setCurrentCamIndex(index);
    setCurrentPane(Math.floor(index / perPane));
  }

  const stale = camera && camera.marked_stale ? 'stale' : '';
  const delayed = camera && camera.marked_delayed ? 'delayed' : '';
  const unavailable = camera && camera.is_on ? '' : 'unavailable';
  const updated = isUpdated ? 'updated' : '';

  // get camera state message
  const getStateMessage = () => {
    if (updated) {
      return 'Updated';
    }

    else {
      if (unavailable) {
        return 'Unavailable';
      }
      else {
        if (delayed && stale) {
          return 'Delayed';
        }
        else if (!delayed && stale) {
          return 'Stale';
        }
        else {
          return '';
        }
      }
    }
  }

  /* Rendering */
  // Main component
  return (
    <div className="camera-orientations-container">
      <div className="header">
        <button className="rotate-direction-btn"
          onClick={rotateCameraOrientation}>

          <img
            className="colocated-camera-icon"
            src={colocatedCamIcon}
            role="presentation"
            alt="colocated cameras icon"
          />

          <span className="title">Direction</span>
        </button>
      </div>

      {(showCompactLayout || showReducedLayout) &&
        <div className="main-content carousel-container--camera-orientations">
          <GoodCarousel
            className="camera-orientations-carousel"
            currentPane={currentPane}
            itemsPerPane={perPane}
            gap={16}
            itemPeek={12}
            animationDuration={0.4}>

            {camera.camGroup.map((cam, index) => (
              <div
                key={cam.id}
                className={'orientation' + (camera.id === cam.id ? ' current' : '')}
                onClick={() => {
                  switchOrientation(index);
                  trackEvent("click", "camera-details", "mobile-camera-orientation", cam.name);
                }}
                onKeyDown={keyEvent => {
                  if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                    switchOrientation(index);
                    trackEvent("click", "camera-details", "mobile-camera-orientation", cam.name);
                  }
                }}>

                <img
                  ref={imageRef}
                  src={cam.links.imageDisplay}
                  alt={cam.name}/>

                {(!stale && !delayed && !unavailable && !updated) &&
                <span
                  className={'status-pill' + (stale ? ' stale' : '') + (delayed ? ' delayed' : '') + (unavailable ? ' unavailable' : '') + (updated ? ' updated' : '')}>
                    {getStateMessage()}
                </span>
}

                <span
                  aria-label={getCameraOrientation(cam.orientation)}
                  className={'label' + (camera.id === cam.id ? ' current' : '')}>

                  {getFullOrientation(cam.orientation)}
                </span>
              </div>
            ))}
          </GoodCarousel>

          {currentCamIndex < (camera.camGroup.length - 1) && (
            <Button
              className="carousel-button next"
              onClick={() => switchOrientation(currentCamIndex + 1)}>
              <FontAwesomeIcon icon={faChevronRight} />
            </Button>
          )}

          {currentCamIndex > 0 && (
            <Button
              className="carousel-button prev"
              onClick={() => switchOrientation(currentCamIndex - 1)}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </Button>
          )}
        </div>
      }

      {showFullLayout &&
        <div className={'main-content' + ' camCount' + camera.camGroup.length}>
          {camera.camGroup.map((cam, index) => (
            <div
              key={cam.id}
              className={'orientation' + (camera.id === cam.id ? ' current' : '') + (unavailable ? ' unavailable' : '')}
              onClick={() => {
                switchOrientation(index);
                trackEvent("click", "camera-details", "camera-orientation", cam.name);
              }}
              onKeyDown={keyEvent => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  switchOrientation(index);
                  trackEvent("click", "camera-details", "camera-orientation", cam.name);
                }
              }}>

              {unavailable && 
                <div className="unavailable-overlay">
                  <FontAwesomeIcon className="icon" icon={faVideoSlash} />
                </div>
              }

              <img
                ref={imageRef}
                src={cam.links.imageDisplay}
                alt={cam.name} />

              {(stale || delayed || unavailable || updated) &&
                <span
                  className={'status-pill' + (stale ? ' stale' : '') + (delayed ? ' delayed' : '') + (unavailable ? ' unavailable' : '') + (updated ? ' updated' : '')}>
                  {getStateMessage()}
                </span>
              }

              <span
                aria-label={getCameraOrientation(cam.orientation)}
                className={'label' + (camera.id === cam.id ? ' current' : '')}>

                {getFullOrientation(cam.orientation)}
              </span>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
