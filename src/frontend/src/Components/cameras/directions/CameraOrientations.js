// React
import React, { useEffect, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import GoodCarousel from 'react-good-carousel';

// Internal imports
import { getCameraOrientation, getFullOrientation } from "../helper";

// Styling
import './CameraOrientations.scss';
import colocatedCamIcon from '../../../images/colocated-camera.svg';
import trackEvent from "../../shared/TrackEvent";

export default function CameraOrientations(props) {
  /* Setup */
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');
  const largeScreen = useMediaQuery('only screen and (min-width: 768px)');
  // const xLargeScreen = useMediaQuery('only screen and (min-width : 992px)');
  const xXLargeScreen = useMediaQuery('only screen and (min-width : 1200px)');

  // Props
  const { camera, loadCamDetails } = props;

  // States
  const initialIndex = camera.camGroup.findIndex(cam => cam.id === camera.id);
  const [currentCamIndex, setCurrentCamIndex] = useState(initialIndex);
  const [currentPane, setCurrentPane] = useState(Math.floor(initialIndex / 2));

  // Effects
  useEffect(() => {
    const nextCam = camera.camGroup[currentCamIndex];
    loadCamDetails(nextCam);
  }, [currentCamIndex]);

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
    setCurrentPane(Math.floor(index / 2));
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

      {(camera.camGroup.length > 2) && smallScreen && !largeScreen && !xXLargeScreen &&
        <div className="main-content carousel-container--camera-orientations">
          <GoodCarousel
            className="camera-orientations-carousel"
            currentPane={currentPane}
            itemsPerPane={2}
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
                  src={cam.links.imageDisplay}
                  alt={cam.name}/>

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

      {(camera.camGroup.length > 3) && !smallScreen && !xXLargeScreen &&
        <div className="main-content carousel-container--camera-orientations">
          <GoodCarousel
            className="camera-orientations-carousel"
            currentPane={currentPane}
            itemsPerPane={3}
            gap={16}
            itemPeek={12}
            animationDuration={0.4}>

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
          </GoodCarousel>

          {currentPane === 0 && (
            <Button
              className="carousel-button next"
              onClick={() => setCurrentPane(currentPane + 1)}>
              <FontAwesomeIcon icon={faChevronRight} />
            </Button>
          )}

          {currentPane === 1 && (
            <Button
              className="carousel-button prev"
              onClick={() => setCurrentPane(currentPane - 1)}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </Button>
          )}
        </div>
      }

      {( ((camera.camGroup.length < 3) && smallScreen) || ((camera.camGroup.length < 4) &&
      !smallScreen && !xXLargeScreen) || xXLargeScreen ) &&
        <div className={'main-content' + ' camCount' + camera.camGroup.length}>
          {camera.camGroup.map((cam, index) => (
            <div
              key={cam.id}
              className={'orientation' + (camera.id === cam.id ? ' current' : '')}
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
      }
    </div>
  );
}
