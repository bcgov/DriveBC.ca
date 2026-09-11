// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { pushFavCam, removeFavCam, updatePendingAction } from '../../../slices/userSlice';

// Navigation
import { useNavigate, useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faVideoSlash,
  faStar,
  faCircleInfo,
  faXmark,
  faArrowsRotate,
  faHourglassClock,
  faWarning,
  faBackwardStep,
  faForwardStep,
  faPause,
  faPlay,
} from '@fortawesome/pro-solid-svg-icons';
import { faStar as faStarOutline, faMountain } from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ImageGallery from 'react-image-gallery';
import RangeSlider from 'react-bootstrap-range-slider';
import parse from 'html-react-parser';
import Skeleton from 'react-loading-skeleton';

// Internal imports
import { AlertContext, AuthContext } from '../../../App';
import { addFavoriteCamera, deleteFavoriteCamera, getCameras, getWebcamReplay } from "../../data/webcams";
import trackEvent from '../../shared/TrackEvent';
import ShareURLButton from '../../shared/ShareURLButton';
import PollingComponent from '../../shared/PollingComponent';
import NearbyWeathers from '../../cameras/nearbyweathers/NearbyWeathers';
import CameraOrientations from '../../cameras/directions/CameraOrientations';
import { API_HOST, REPLAY_THE_DAY } from '../../../env';

// Styling
import './CamPanel.scss';
import 'react-loading-skeleton/dist/skeleton.css';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import 'react-image-gallery/styles/image-gallery.css';


// Main component
export default function CamPanel(props) {
  /* Setup */
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');
  // Side panel (desktop) vs mobile drawer — match Map.jsx breakpoint
  const largeScreen = useMediaQuery('only screen and (min-width: 768px)');

  // Props
  const { camFeature, isCamDetail, showRouteObjs } = props;
  const newCam = camFeature.id ? camFeature : camFeature.getProperties();

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);

  // Navigation
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux
  const dispatch = useDispatch();
  const { favCams } = useSelector(useCallback(memoize(state => ({
    favCams: state.user.favCams
  }))));

  // Refs
  const isInitialMount = useRef(true);
  const isFirstCamFeature = useRef(true);
  const camPanelRef = useRef(null);
  const rootCamRef = useRef(newCam);
  const imageRef = useRef(null);
  const viewedCamera = useRef({ id: newCam.id, last_update_modified: newCam.last_update_modified });
  const refImg = useRef(null);

  // States
  const [camera, setCamera] = useState(newCam);
  const [camIndex, setCamIndex] = useState(0);
  const [show, setShow] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [replay, setReplay] = useState(false);
  const [replayImages, setReplayImages] = useState([]);
  const [hasImageEnded, setHasImageEnded] = useState(false);
  // Drawer is used when !largeScreen in Map (including isCamDetail preview)
  const [inDrawer, setInDrawer] = useState(!largeScreen || !!isCamDetail);

  // Effects
  useEffect(() => {
    if (!camPanelRef.current) {
      return;
    }

    setInDrawer(!!camPanelRef.current.closest(
      '.drawer-content, .vladyoslav-drawer-draggable, [class*="vladyoslav-drawer-draggable"]'
    ));
  }, [camFeature, largeScreen, isCamDetail]);

  // Effects
  useEffect(() => {
    const newCam = camFeature.id ? camFeature : camFeature.getProperties();
    rootCamRef.current = newCam;
    setCamera(newCam);
    viewedCamera.current = { id: newCam.id, last_update_modified: newCam.last_update_modified };

    let initialIndex = 0;
    if (isFirstCamFeature.current) {
      const urlIndex = searchParams.get("camIndex");
      initialIndex = urlIndex ? Number.parseInt(urlIndex, 10) : 0;
      isFirstCamFeature.current = false;
    }

    setCamIndex(initialIndex);

    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", 'camera');
    newParams.set("id", newCam.id);
    newParams.set("camIndex", initialIndex);
    newParams.delete("display_category");

    setSearchParams(newParams, { replace: true });
    setIsUpdated(false);
    setIsLoading(false);
    setNextUpdate(formatNextUpdate(newCam));

  }, [camFeature]);

  useEffect(() => {
    setNextUpdate(formatNextUpdate(camera));
  }, [camera]);

  useEffect(() => {
    if (camera) {
      loadReplay(camera);
    }
  }, [camera?.id]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Update the displayed camera based on the new index
    if (rootCamRef.current.camGroup?.[camIndex]) {
      const nextCam = rootCamRef.current.camGroup[camIndex];
      setCamera(nextCam);
      viewedCamera.current = { id: nextCam.id, last_update_modified: nextCam.last_update_modified };

      // Sync the URL index
      const newParams = new URLSearchParams(searchParams);
      newParams.set("camIndex", camIndex);
      setSearchParams(newParams, { replace: true });
    }
  }, [camIndex]);

  /* Helpers */
  const calculateNextUpdateTime = (cam) => {
    const lastUpdateTime = new Date(cam.last_update_modified);
    const nextUpdateTime = new Date(lastUpdateTime.getTime() + cam.update_period_mean * 1000);
    const currentTimePlusUpdatePeriod = new Date(Date.now() + cam.update_period_mean * 1000);
    return nextUpdateTime < new Date() ? currentTimePlusUpdatePeriod : nextUpdateTime;
  };

  const formatNextUpdate = (cam) => {
    if (!cam?.last_update_modified || !cam?.update_period_mean) {
      return null;
    }

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    }).format(calculateNextUpdateTime(cam));
  };

  const pauseReplay = () => {
    const pauseIcon = document.querySelectorAll(".popup--camera .fa-pause");
    if (pauseIcon.length > 0) {
      pauseIcon[0].parentElement.click();
    }
  };

  const loadReplay = async (cam) => {
    const replayImageList = await getWebcamReplay(cam);
    const images = replayImageList.map(url => {
      if (cam.https_cam) {
        return { original: `${window.location.origin}/images/replaytheday/${cam.id}/${url}.jpg` };
      }
      return { original: `${REPLAY_THE_DAY}${cam.id}/${url}.jpg` };
    });
    setReplayImages(images);
  };

  const shouldRenderReplay = () => {
    // DELETE before merge. Temporary there for styling purposes only: always show Replay the day.
    return true;

    if (!camera?.last_update_modified) {
      return false;
    }

    const lastUpdatedDate = Date.parse(camera.last_update_modified);
    const oneDayAgo = new Date().getTime() - 1 * 24 * 60 * 60 * 1000;

    return camera.is_on && lastUpdatedDate > oneDayAgo;
  };

  const toggleReplay = () => {
    setReplay(!replay);
  };

  const handleImageSlide = (index) => {
    setHasImageEnded(index === replayImages.length - 1);
  };

  const play = () => {
    replayImages.forEach(img => {
      const cachedImage = new Image();
      cachedImage.src = img.original;
      cachedImage.decode();
    });

    if (hasImageEnded) {
      refImg.current.slideToIndex(0);
    }
  };

  const customControls = () => {
    return (
      refImg.current && (
        <div className="range-slider-container">
          <RangeSlider
            value={refImg.current.getCurrentIndex()}
            max={replayImages.length}
            tooltip="off"
            onChange={e =>
              refImg.current.slideToIndex(parseInt(e.target.value, 10))
            }
          />
        </div>
      )
    );
  };

  const customLeftNav = (onClick, disabled) => {
    return (
      <div className="replay-control replay-control--backward">
        <Button
          className="replay-btn replay-backward"
          onClick={onClick}
          disabled={disabled}
          aria-label="rewind">
          <FontAwesomeIcon icon={faBackwardStep} />
        </Button>
      </div>
    );
  };

  const customPlayPause = (onClick, isPlaying) => {
    return (
      <div className="replay-control replay-control--play">
        <Button
          className="replay-btn replay-play"
          onClick={onClick}
          isPlaying={isPlaying}
          aria-label={isPlaying ? 'pause' : 'play'}>
          {isPlaying ? (
            <FontAwesomeIcon icon={faPause} />
          ) : (
            <FontAwesomeIcon icon={faPlay} />
          )}
        </Button>
      </div>
    );
  };

  const customRightNav = (onClick, disabled) => {
    return (
      <div className="replay-control replay-control--forward">
        <Button
          className="replay-btn replay-forward"
          onClick={onClick}
          disabled={disabled}
          aria-label="fastforward">
          <FontAwesomeIcon icon={faForwardStep} />
        </Button>
      </div>
    );
  };

  const toggleAuthModal = (action) => {
    setAuthContext((prior) => {
      if (!prior.showingModal) {
        return { ...prior, showingModal: true, action };
      }
      return prior;
    })
  };

  const updateCameraImage = (cam) => {
    setIsUpdated(true);
    setIsLoading(true);
    setShow(true);

    if (imageRef.current) {
      imageRef.current.src = `${cam.links.imageDisplay}?ts=${new Date(cam.last_update_modified).getTime()}`;
    }
  };

  const updateCamera = () => {
    rootCamRef.current.camGroup.forEach((cam, ii) => {
      getCameras(
        null,
        `${API_HOST}/api/webcams/${cam.id}/`,

      ).then((update) => {
        if (update.last_update_modified !== cam.last_update_modified) {
          // using data attribute avoids lexical binding of camIndex state that
          // locks it at the initial value
          const currentCamIndex = camPanelRef.current.dataset.current;
          update.camGroup = rootCamRef.current.camGroup;
          rootCamRef.current.camGroup[ii] = update;
          if (ii == currentCamIndex) {
            setCamera(rootCamRef.current.camGroup[ii]);
            updateCameraImage(update);
            viewedCamera.current.last_update_modified = update.last_update_modified;
          }
        }
      }).catch(error => console.log(error));
    })
  }

  const loadCamDetails = (camData) => {
    if (viewedCamera.current && viewedCamera.current.id === camData.id) {
      return;
    }

    setIsUpdated(false);
    setIsLoading(false);
    setReplay(false);
    pauseReplay();
    viewedCamera.current = { id: camData.id, last_update_modified: camData.last_update_modified };

    const index = rootCamRef.current.camGroup?.findIndex(cam => cam.id === camData.id);
    if (index >= 0) {
      setCamIndex(index);
    }

    setCamera(camData);
    trackEvent('click', 'map', 'camera', camData.name);
  };

  /* Handlers */
  const handlePopupClick = e => {
    if (!isCamDetail) {
      navigate(`/cameras/${camera.id}`);
    }
  };

  function handleChildClick(e) {
    e.stopPropagation();
    setShow(!show);
  }

  const favoriteHandler = () => {
    // User logged in, default handler
    if (favCams && authContext.loginStateKnown && authContext.username) {
      if (favCams.includes(camera.id)) {
        deleteFavoriteCamera(camera.id, dispatch, removeFavCam);
        setAlertMessage(<p>Removed from <a href="/my-cameras">My cameras</a></p>);

      } else {
        addFavoriteCamera(camera.id, dispatch, pushFavCam);
        setAlertMessage(<p>Saved to <a href="/my-cameras">My cameras</a></p>);
      }

    // User not logged in, save pending action and open login modal
    } else {
      toggleAuthModal('Sign in');
      dispatch(updatePendingAction({
        action: 'pushFavCam',
        payload: camera.id,
      }));
    }
  }

  /* Rendering */
  const loading = isLoading ? 'loading' : '';
  const stale = camera?.marked_stale ? 'stale' : '';
  const delayed = camera?.marked_delayed ? 'delayed' : '';
  const unavailable = camera?.is_on ? '' : 'unavailable';
  const updated = isUpdated ? 'updated' : '';

  // Main component
  return (
    <div className="popup popup--camera" ref={camPanelRef} data-current={camIndex}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="22" height="22" rx="11" fill="white"/>
            <rect x="1" y="1" width="22" height="22" rx="11" stroke="#255A90" strokeWidth="2"/>
            <path d="M6 9.125C6 8.37305 6.60156 7.75 7.375 7.75H12.875C13.627 7.75 14.25 8.37305 14.25 9.125V14.625C14.25 15.3984 13.627 16 12.875 16H7.375C6.60156 16 6 15.3984 6 14.625V9.125ZM18.0098 8.52344C18.2246 8.65234 18.375 8.88867 18.375 9.125V14.625C18.375 14.8828 18.2246 15.1191 18.0098 15.248C17.7734 15.3555 17.5156 15.3555 17.3008 15.2051L15.2383 13.8301L14.9375 13.6367V13.25V10.5V10.1348L15.2383 9.94141L17.3008 8.56641C17.5156 8.41602 17.7734 8.41602 18.0098 8.52344Z" fill="#255A90"/>
          </svg>
          <p className="name">Camera</p>
        </div>
        <ShareURLButton/>
      </div>

      {camera && (
        <div className="popup__content">
          <div className="popup__content__title">
            <p className="name">{camera.name}</p>
          </div>
          {nextUpdate && (
            <p className="next-update">Next update attempt {nextUpdate}</p>
          )}

          {authContext.loginStateKnown &&
              <button
                className={`favourite-btn btn-tertiary ${(favCams && favCams.includes(camera.id)) ? 'favourited' : ''}`}
                aria-label={`${(favCams && favCams.includes(camera.id)) ? 'Remove favourite' : 'Add favourite'}`}
                onClick={favoriteHandler}>

                {(favCams && favCams.includes(camera.id)) ?
                  (<React.Fragment><FontAwesomeIcon icon={faStar} /><span>Remove</span></React.Fragment>) :
                  (<React.Fragment><FontAwesomeIcon icon={faStarOutline} /><span>Save</span></React.Fragment>)
                }
              </button>
            }

          <div className="camera-imagery">
            <div className="camera-imagery__details d-flex">
              <div className="camera-imagery__details__left flex-grow-1">
                <div className={`image-wrap ${updated} ${stale} ${delayed} ${unavailable} ${loading} ${replay ? 'replay' : ''}`}>
                  {shouldRenderReplay() && (
                    <div className={`replay-div ${replay ? 'replay-on' : 'replay-off'}`}>
                      <Form className="replay-the-day">
                        <Form.Check
                          onChange={toggleReplay}
                          type="switch"
                          id="replay-toggle-panel"
                          label="Replay the day"
                          checked={replay} />
                      </Form>
                    </div>
                  )}

                  <div className="card-img-box">
                    {!replay ? (
                      <>
                        <img
                          ref={imageRef}
                          src={camera.links.imageDisplay}
                          alt={camera.name}
                          onLoad={() => setIsLoading(false)}
                          style={{ display: isLoading || unavailable ? 'none' : 'block' }}
                        />

                        {isLoading ? <Skeleton height={400} /> : null}

                        {!unavailable && !stale && !delayed && updated && (
                          <div className="card-notification">
                            {!isLoading && (
                              <>
                                <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                                  <FontAwesomeIcon icon={faArrowsRotate} />
                                  <p>Image automatically updated to show the latest image received.</p>
                                  <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                                </div>
                                <div className={'card-pill' + (show ? ' bounce' : ' hidden')}
                                  onClick={handleChildClick}
                                  onKeyDown={keyEvent => {
                                    if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                                      handleChildClick();
                                    }
                                  }}>
                                  <p>Updated</p>
                                  <FontAwesomeIcon icon={faCircleInfo} />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {!unavailable && stale && !delayed && (
                          <div className="card-notification">
                            {!isLoading && (
                              <>
                                <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                                  <FontAwesomeIcon icon={faHourglassClock} />
                                  <p>Unable to retrieve latest image. Displaying last image received.</p>
                                  <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                                </div>
                                <div
                                  className={'card-pill' + (show ? ' bounce' : ' hidden')}
                                  onClick={handleChildClick}
                                  onKeyDown={keyEvent => {
                                    if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                                      handleChildClick();
                                    }
                                  }}>
                                  <p>Stale</p>
                                  <FontAwesomeIcon icon={faCircleInfo} />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {!unavailable && stale && delayed && (
                          <div className="card-notification">
                            {!isLoading && (
                              <>
                                <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                                  <div>
                                    <FontAwesomeIcon className="icon" icon={faWarning} />

                                    <p className="bold">Significant delays in receiving new images</p>
                                    <p>This is sometimes due to:</p>
                                    <ul>
                                      <li>Intermittent data signals in the areas</li>
                                      <li>Disruptions from weather</li>
                                      <li>Camera malfunction</li>
                                    </ul>
                                    <p>The image will be updated automatically as soon as the camera comes back online.</p>
                                  </div>

                                  <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                                </div>
                                <div
                                  className={'card-pill' + (show ? ' bounce' : ' hidden')}
                                  onClick={handleChildClick}
                                  onKeyDown={keyEvent => {
                                    if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                                      handleChildClick();
                                    }
                                  }}>
                                  <p>Delayed</p>
                                  <FontAwesomeIcon icon={faCircleInfo} />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {unavailable && !isLoading && (
                          <>
                            <div className="unavailable-message">
                              <FontAwesomeIcon className="icon" icon={faVideoSlash} />
                              <h3>Image unavailable due to technical difficulties</h3>
                              <p>This is sometimes due to:</p>
                              <ul>
                                <li>Power disruptions to the camera</li>
                                <li>Signal transmission issues</li>
                              </ul>
                              <p>Our technicians have been alerted and service will resume as soon as possible. Repairs are subject to the availability of repair parts and staff’s ability to access the location. Camera functions will return once repairs are complete.</p>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <ImageGallery
                        ref={refImg}
                        slideInterval={300}
                        items={replayImages}
                        slideDuration={0}
                        showFullscreenButton={false}
                        alt="replay"
                        disableKeyDown={true}
                        renderCustomControls={customControls}
                        renderLeftNav={customLeftNav}
                        renderPlayPauseButton={customPlayPause}
                        renderRightNav={customRightNav}
                        onSlide={index => handleImageSlide(index)}
                        onPlay={play}
                        infinite={false}
                      />
                    )}
                  </div>
                </div>
                <p
                  className={'credit' + (replay ? ' under-replay' : '')}
                  dangerouslySetInnerHTML={{ __html: camera.credit }}>
                </p>
              </div>
              <div className="camera-imagery__details__right">
                {camera.camGroup &&
                  <CameraOrientations
                    camData={camera}
                    loadCamDetails={loadCamDetails}
                    slidesPerView={inDrawer ? undefined : 2}
                  />
                }
              </div>
            </div>
            
            <div className="camera-details__description">
              <p className="bold">Camera details</p>
              <p className="camera-details-info">{parse(camera.caption)}</p>

              <div className="data-card">
                <div className="data-card__row">
                  <div className="data-icon">
                    <FontAwesomeIcon icon={faMountain} />
                  </div>
                  <p className="label">Elevation</p>
                  <p className="data">{camera.elevation}m</p>
                </div>

                {camera.highway != '0' && (
                  <div className="data-card__row">
                    <div className="data-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_cam_panel_hwy)">
                          <path fillRule="evenodd" clipRule="evenodd" d="M6.24 1.78V1.14H9.97V1.78C9.97 2.25 10.36 2.64 10.83 2.64H14.3L13.78 3.64C13.72 3.76 13.69 3.9 13.69 4.03V11.45C13.72 11.96 13.51 12.8 12.7 13.52C11.9 14.23 10.46 14.86 7.99 14.86C5.52 14.86 4.09 14.23 3.28 13.52C2.47 12.8 2.26 11.97 2.29 11.45V4.03C2.29 3.89 2.26 3.76 2.2 3.64L1.69 2.64H5.38C5.85 2.64 6.24 2.25 6.24 1.78ZM5.77 0C5.5 0 5.28 0.22 5.28 0.49V1.56H0L0.34 2.21L1.21 3.89V11.55C1.17 12.35 1.5 13.47 2.53 14.39C3.58 15.32 5.3 16 8 16C10.7 16 12.43 15.32 13.47 14.39C14.51 13.47 14.83 12.35 14.79 11.55V3.88L15.66 2.2L16 1.55H10.94V0.49C10.94 0.22 10.72 0 10.45 0H5.77ZM5.66 5.63C6 5.63 6.29 5.65 6.55 5.7C6.81 5.74 7.02 5.82 7.2 5.92C7.37 6.02 7.5 6.15 7.59 6.32C7.68 6.48 7.72 6.68 7.72 6.93C7.72 7.22 7.65 7.46 7.52 7.66C7.39 7.86 7.19 7.98 6.93 8.02V8.06C7.06 8.09 7.18 8.13 7.29 8.18C7.4 8.23 7.5 8.3 7.58 8.39C7.66 8.48 7.73 8.59 7.78 8.74C7.83 8.88 7.85 9.05 7.85 9.25C7.85 9.48 7.81 9.68 7.72 9.86C7.63 10.04 7.51 10.2 7.34 10.33C7.18 10.46 6.98 10.56 6.75 10.62C6.52 10.69 6.26 10.72 5.97 10.72H4.06V5.65H5.65L5.66 5.63ZM5.78 7.63C6.09 7.63 6.31 7.58 6.43 7.49C6.55 7.4 6.61 7.25 6.61 7.05C6.61 6.85 6.54 6.71 6.4 6.63C6.26 6.55 6.03 6.51 5.72 6.51H5.15V7.64H5.78V7.63ZM5.15 8.49V9.81H5.86C6.19 9.81 6.41 9.75 6.54 9.62C6.67 9.5 6.73 9.33 6.73 9.12C6.73 8.93 6.66 8.78 6.53 8.66C6.4 8.54 6.16 8.49 5.82 8.49H5.15ZM11.04 6.45C10.62 6.45 10.31 6.61 10.09 6.91C9.87 7.22 9.76 7.64 9.76 8.18C9.76 8.72 9.86 9.14 10.06 9.43C10.26 9.73 10.59 9.87 11.03 9.87C11.24 9.87 11.44 9.85 11.65 9.8C11.86 9.75 12.09 9.68 12.33 9.6V10.5C12.11 10.59 11.88 10.66 11.66 10.7C11.44 10.74 11.2 10.76 10.92 10.76C10.39 10.76 9.96 10.65 9.62 10.44C9.28 10.22 9.03 9.92 8.87 9.53C8.71 9.14 8.63 8.68 8.63 8.16C8.63 7.64 8.72 7.2 8.91 6.8C9.1 6.4 9.37 6.1 9.72 5.88C10.07 5.66 10.51 5.55 11.03 5.55C11.28 5.55 11.54 5.58 11.79 5.65C12.04 5.71 12.29 5.8 12.52 5.91L12.17 6.79C11.98 6.7 11.79 6.62 11.59 6.55C11.4 6.48 11.21 6.45 11.02 6.45H11.04Z" fill="#605E5C"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_cam_panel_hwy">
                            <rect width="16" height="16" fill="white"/>
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <p className="label">Highway</p>
                    <p className="data">{camera.highway === '1' ? 'Trans Canada' : camera.highway}</p>
                  </div>
                )}
              </div>
            </div>

            {camera &&
              <NearbyWeathers camera={camera}/>
            }
          </div>

          <PollingComponent runnable={updateCamera} interval={5000} />

        </div>
      )}
    </div>
  );
}
