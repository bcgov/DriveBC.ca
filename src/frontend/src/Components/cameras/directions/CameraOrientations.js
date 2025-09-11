// React
import React, { useEffect, useRef, useState } from 'react';

// Internal imports
import { getCameraOrientation, getFullOrientation } from "../helper";

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import GoodCarousel from 'react-good-carousel';
import { useMediaQuery } from '@uidotdev/usehooks';

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

  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');
  const largeScreen = useMediaQuery('only screen and (min-width: 768px)');
  // const xLargeScreen = useMediaQuery('only screen and (min-width : 992px)');
  const xXLargeScreen = useMediaQuery('only screen and (min-width : 1200px)');

  // For mobile carousel
  const carouselRef = useRef(null);

  const [currentPane, setCurrentPane] = useState(0);
  const [touchstartX, setTouchstartX] = useState(0);

  useEffect(() => {
    // Implements swiping for mobile/tablet devices
    if (!carouselRef.current) {
      return;
    }
    const carouselRefLocal = carouselRef;
    const onTouchStart = (e) => {
      setTouchstartX(e.changedTouches[0].screenX);
    };
    const onTouchEnd = (e) => {
      const touchendX = e.changedTouches[0].screenX;
      if (touchendX < touchstartX && currentPane !== camera.camGroup.length - 1) {
        setCurrentPane(currentPane + 1);
      } else if (touchendX > touchstartX && currentPane !== 0) {
        setCurrentPane(currentPane - 1);
      }
    };
    carouselRefLocal.current.addEventListener("touchstart", onTouchStart);
    carouselRefLocal.current.addEventListener("touchend", onTouchEnd);

  }, [carouselRef, touchstartX]);

  /* Rendering */
  // Main component
  return (
    <div className="camera-orientations-container">
      <div className="header">
        <button className="rotate-direction-btn"
          onClick={rotateCameraOrientation}
        >
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
        <div className="main-content carousel-container--camera-orientations" ref={carouselRef}>
          <GoodCarousel
            className="camera-orientations-carousel"
            currentPane={currentPane}
            itemsPerPane={2}
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

      {(camera.camGroup.length > 3) && !smallScreen && !xXLargeScreen &&
        <div className="main-content carousel-container--camera-orientations" ref={carouselRef}>
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
      }
      
    </div>
  );
}
