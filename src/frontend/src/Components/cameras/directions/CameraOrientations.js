// React
import React, { useEffect, useRef, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import GoodCarousel from 'react-good-carousel';

// Internal imports
import { getCameraOrientation, getFullOrientation } from "../helper";
import colocatedCamIcon from '../../../images/colocated-camera.svg';
import trackEvent from "../../shared/TrackEvent";
import CameraThumbnail from './CameraThumbnail';

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
  const showCompactLayout = (camData.camGroup.length > 2) && smallScreen;
  const showReducedLayout = (camData.camGroup.length > 3) && inBetweenScreen;
  const showFullLayout = (
    ((camData.camGroup.length < 3) && smallScreen) ||
    ((camData.camGroup.length < 4) && inBetweenScreen) ||
    xXLargeScreen
  );
  const perPane = showCompactLayout ? 2 : 3;

  const initialIndex = camData.camGroup.findIndex(cam => cam.id === camData.id);
  const [currentCamIndex, setCurrentCamIndex] = useState(initialIndex);
  const [currentPane, setCurrentPane] = useState(Math.floor(initialIndex / perPane));

  // Effects
  useEffect(() => {
    const nextCam = camData.camGroup[currentCamIndex];
    loadCamDetails(nextCam);
  }, [currentCamIndex]);

  /* Handlers */
  const rotateCameraOrientation = () => {
    const currentIndex = camData.camGroup.findIndex(cam => cam.id === camData.id);
    const nextIndex = (currentIndex + 1) % camData.camGroup.length;

    const nextCamera = camData.camGroup[nextIndex];
    switchOrientation(nextIndex);
    loadCamDetails(nextCamera);
    trackEvent("click", "camera-details", "camera-rotate", nextCamera.name);
  };

  // Switch orientation for mobile carousel
  const switchOrientation = (index) => {
    setCurrentCamIndex(index);
    setCurrentPane(Math.floor(index / perPane));
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

            {camData.camGroup.map((cam, index) => (
              <CameraThumbnail key={cam.id} thumbnailCamera={cam} mainCamera={camData.camGroup[currentCamIndex]} index={index} switchOrientation={switchOrientation} />
            ))}
          </GoodCarousel>

          {currentCamIndex < (camData.camGroup.length - 1) && (
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
        <div className={'main-content' + ' camCount' + camData.camGroup.length}>
          {camData.camGroup.map((cam, index) => (
            <CameraThumbnail key={cam.id} thumbnailCamera={cam} mainCamera={camData.camGroup[currentCamIndex]} index={index} switchOrientation={switchOrientation} />
          ))}
        </div>
      }
    </div>
  );
}
