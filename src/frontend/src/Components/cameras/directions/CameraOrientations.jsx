// React
import React, { useEffect, useState, useCallback } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft } from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import useEmblaCarousel from 'embla-carousel-react'; 

// Internal imports
import colocatedCamIcon from '../../../images/colocated-camera.svg';
import trackEvent from "../../shared/TrackEvent";
import CameraThumbnail from './CameraThumbnail';

// Styling
import './CameraOrientations.scss';

export default function CameraOrientations(props) {
  /* Setup */
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');
  const inBetweenScreen = useMediaQuery('only screen and (min-width: 576px) and (max-width: 1199px)');
  const xXLargeScreen = useMediaQuery('only screen and (min-width : 1200px)');

  const { camData, loadCamDetails } = props;

  const showCompactLayout = (camData.camGroup.length > 2) && smallScreen;
  const showReducedLayout = (camData.camGroup.length > 3) && inBetweenScreen;
  const showFullLayout = (
    ((camData.camGroup.length < 3) && smallScreen) ||
    ((camData.camGroup.length < 4) && inBetweenScreen) ||
    xXLargeScreen
  );
  const perPane = showCompactLayout ? 2 : 3;

  const [currentCamIndex, setCurrentCamIndex] = useState(0);
  const [currentPane, setCurrentPane] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: perPane,
    duration: 25,
    containScroll: 'trimSnaps',
  });

  useEffect(() => {
    if (emblaApi) emblaApi.scrollTo(currentPane);
  }, [currentPane, emblaApi]);

  useEffect(() => {
    const nextCam = camData.camGroup[currentCamIndex];
    loadCamDetails(nextCam);
  }, [currentCamIndex]);

  const getInitialIndex = () => {
    return camData.camGroup.findIndex(cam => cam.id === camData.id);
  }

  useEffect(() => {
    const initialIndex = getInitialIndex();
    setCurrentCamIndex(initialIndex);
    setCurrentPane(Math.floor(initialIndex / perPane));
  }, [camData]);

  /* Handlers */
  const rotateCameraOrientation = () => {
    const currentIndex = camData.camGroup.findIndex(cam => cam.id === camData.id);
    const nextIndex = (currentIndex + 1) % camData.camGroup.length;
    const nextCamera = camData.camGroup[nextIndex];
    switchOrientation(nextIndex);
    loadCamDetails(nextCamera);
    trackEvent("click", "camera-details", "camera-rotate", nextCamera.name);
  };

  const switchOrientation = (index) => {
    setCurrentCamIndex(index);
    setCurrentPane(Math.floor(index / perPane));
  }

  const slideWidth = `calc((100% - ${(perPane - 1) * 16}px - 12px) / ${perPane})`;

  return (
    <div className="camera-orientations-container">
      <div className="header">
        <button className="rotate-direction-btn" onClick={rotateCameraOrientation}>
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

          <div className="camera-orientations-carousel embla" ref={emblaRef}>
            <div className="embla__container">
              {camData.camGroup.map((cam, index) => (
                <div
                  key={cam.id}
                  className="embla__slide"
                  style={{ flex: `0 0 ${slideWidth}` }}
                >
                  <CameraThumbnail
                    thumbnailCamera={cam}
                    mainCamera={camData.camGroup[currentCamIndex]}
                    index={index}
                    switchOrientation={switchOrientation}
                  />
                </div>
              ))}
            </div>
          </div>

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
            <CameraThumbnail
              key={cam.id}
              thumbnailCamera={cam}
              mainCamera={camData.camGroup[currentCamIndex]}
              index={index}
              switchOrientation={switchOrientation}
            />
          ))}
        </div>
      }
    </div>
  );
}