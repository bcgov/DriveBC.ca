// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createSearchParams, useParams, useNavigate } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { pushFavCam, removeFavCam, updatePendingAction } from '../slices/userSlice';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBackward,
  faCircleInfo,
  faClockRotateLeft,
  faHourglassClock,
  faForward,
  faPause,
  faPlay,
  faStar,
  faVideoSlash,
  faWarning,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { faStar as faStarOutline, faMountain, faRefresh, faFlag } from '@fortawesome/pro-regular-svg-icons';
import { faArrowsRotate } from '@fortawesome/pro-solid-svg-icons';
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Tooltip from 'react-bootstrap/Tooltip';
import ImageGallery from 'react-image-gallery';
import parse from 'html-react-parser';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import { useMediaQuery } from '@uidotdev/usehooks';

// Internal imports
import { AlertContext, AuthContext } from '../App';
import { addFavoriteCamera, deleteFavoriteCamera, getCameraGroupMap, getCameras } from '../Components/data/webcams.js';
import { getCameraOrientation } from '../Components/cameras/helper.js';
import { getWebcamReplay } from '../Components/data/webcams';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components/map/errors/NetworkError';
import ServerErrorPopup from '../Components/map/errors/ServerError';
import MapWrapper from '../Components/map/MapWrapper';
import Footer from '../Footer.js';
import FriendlyTime from '../Components/shared/FriendlyTime';
import CurrentCameraIcon from '../Components/cameras/CurrentCameraIcon';
import trackEvent from '../Components/shared/TrackEvent';
import PollingComponent from '../Components/shared/PollingComponent';

// Styling
import './CameraDetailsPage.scss';
import '../Components/map/Map.scss';

import colocatedCamIcon from '../images/colocated-camera.svg';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import Spinner from 'react-bootstrap/Spinner';

export default function CameraDetailsPage() {
  /* Setup */
  // Navigation
  const navigate = useNavigate();
  const params = useParams();

  // Redux
  const dispatch = useDispatch();
  const { favCams } = useSelector(useCallback(memoize(state => ({
    favCams: state.user.favCams
  }))));

  // Contexts
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);

  // Refs
  const isInitialMount = useRef(true);
  const isUpdate = useRef(false);
  const imageRef = useRef(null);
  const viewedCamera = useRef({ id: params.id, last_update_modified: null});
  const cameraGroupRefs = useRef(new Set());

  // State hooks
  const [camera, setCamera] = useState(null);
  const [replay, setReplay] = useState(false);
  const [replayImages, setReplayImages] = useState([]);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('webcam');
  const [hasImageEnded, setHasImageEnded] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [cameraGroup, setCameraGroup] = useState(null);
  const [showLoader, setShowLoader] = useState(true);
  const [show, setShow] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCameraSet, setIsCameraSet] = useState(false);
  const pauseReplay = () => {
    const pauseIcon = document.querySelectorAll(".fa-pause");
    if (pauseIcon.length > 0) {
      pauseIcon[0].parentElement.click();
    }
  };
  const handleCameraImageClick = (event) => {
    const container = event.currentTarget.closest(".camera-orientations");
    const buttons = container.querySelectorAll(".camera-direction-btn");
    let currentIndex = Array.from(buttons).findIndex(
      (button) => button.classList.contains("current")
    );
    if (currentIndex === -1) {
      currentIndex = activeIndex;
    }
    const nextIndex = (currentIndex + 1) % buttons.length;
    buttons[nextIndex].focus();
    setActiveIndex(nextIndex);
    const nextCamera = camera.camGroup[nextIndex];
    setCamera(nextCamera);
    setIsCameraSet(true);
    trackEvent("click", "camera-list", "camera", nextCamera.name);
    pauseReplay();
  };

  useEffect(() => {
    if (showLoader) {
      setShowLoader(true);
    }
  }, [showLoader]);

  // Error handling
  const displayError = error => {
    if (error instanceof ServerError) {
      setShowServerError(true);
    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  };

  // Data functions
  const loadCamDetails = (camData, isButtonClicked = false) => {
    // Camera data
    if (isButtonClicked) {
      isInitialMount.current = false;
    }

    if (!isInitialMount.current) {
      setIsUpdated(false);
      viewedCamera.current = { id: camData.id, last_update_modified: camData.last_update_modified}

      if(!isCameraSet){
        setCamera(camData);
        pauseReplay();
      }
      
      trackEvent('click', 'camera-details', 'camera', camData.name);

      // Next update time
      const nextUpdateTime = calculateNextUpdateTime(camData);
      const nextUpdateTimeFormatted = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
      }).format(nextUpdateTime);
      setNextUpdate(nextUpdateTimeFormatted);

      // Last update time
      setLastUpdate(camData.last_update_modified);

      // Replace window title and URL
      document.title = `DriveBC - Cameras - ${camData.name}`;
      window.history.replaceState(history.state, null, `/cameras/${camData.id}`);
    }

    setShowLoader(false);
  };

  async function initCamera(id) {
    const allCameras = await getCameras().catch(error => displayError(error));
    const cameraGroupMap = getCameraGroupMap(allCameras);

    const camData = await getCameras(
      null,
      `${window.API_HOST}/api/webcams/${id}/`,
    ).catch(error => displayError(error));

    // Group cameras
    const group = cameraGroupMap[camData.group];
    camData.camGroup = group;
    camData.camGroup.forEach(cam => (cam.camGroup = group));

    loadCamDetails(camData);
    setCameraGroup(camData.camGroup);

    cameraGroupRefs.current = new Set(group.map(cam => cam.id));
  }

  const updateCamera = async () => {
    isUpdate.current = true;

    const group = [];

    for (const cameraId of cameraGroupRefs.current) {
      const camData = await getCameras(
        null,
        `${window.API_HOST}/api/webcams/${cameraId}/`,
      ).catch(error => displayError(error));

      if (camData) {
        group.push(camData);
      }
    }

    const camData = group.find(cam => cam.id === viewedCamera.current.id);
    camData.camGroup = group;
    camData.camGroup.forEach(cam => (cam.camGroup = group));

    setCameraGroup(camData.camGroup);
    if(!isCameraSet){
      setCamera(camData);
    }

    if (camData.last_update_modified !== viewedCamera.current.last_update_modified) {
      setIsUpdated(true);
      updateCameraImage(camData);
    }

    viewedCamera.current.last_update_modified = camData.last_update_modified;

    // Next update time
    const nextUpdateTime = calculateNextUpdateTime(camData);
    const nextUpdateTimeFormatted = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    }).format(nextUpdateTime);
    setNextUpdate(nextUpdateTimeFormatted);

    // Last update time
    setLastUpdate(camData.last_update_modified);
  }

  const loadReplay = async cam => {
    const replayImageList = await getWebcamReplay(cam);
    const replayImages = replayImageList.map(url => {
      return { original: `${window.REPLAY_THE_DAY}${camera.id}/${url}.jpg` };
    });
    setReplayImages(replayImages);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      initCamera(params.id);
      isInitialMount.current = false;
    } else if (camera) {
      loadReplay(camera);
    }
  }, [camera]);

  useEffect(() => {
    if (camera !== undefined && camera !== null && !isUpdate.current) {
      const index = camera.camGroup.findIndex(cam => cam.id === camera.id);

      if (index > -1 && index !== 0) {
        const newCamGroup = camera.camGroup;
        if (newCamGroup[0].id !== camera.camGroup[index].id) {
          loadCamDetails(camera);
          isInitialMount.current = true;
        }
      }
    }
  }, [cameraGroup]);

  const toggleReplay = () => {
    setReplay(!replay);
  };

  const mapViewRoute = () => {
    navigate({
      pathname: '/',
      search: `?${createSearchParams({
        type: "camera",
        id: camera.id,
      })}`
    });
  };

  // ReplayTheDay
  const refImg = useRef(null);

  const customControls = () => {
    return (
      refImg.current && (
        <div className="range-slider-container">
          <RangeSlider
            value={refImg.current.getCurrentIndex()}
            max={replayImages.length}
            tooltip="off"
            onChange={e =>
              refImg.current.slideToIndex(parseInt(e.target.value))
            }
          />
        </div>
      )
    );
  };

  // Component functions
  const customLeftNav = (onClick, disabled) => {
    return (
      <div className="replay-control replay-control--backward">
        <Button
          className="replay-btn replay-backward"
          onClick={onClick}
          disabled={disabled}
          aria-label="rewind">
          <FontAwesomeIcon icon={faBackward} />
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
          <FontAwesomeIcon icon={faForward} />
        </Button>
      </div>
    );
  };

  // Handlers
  const favoriteHandler = () => {
    // User logged in, default handler
    if (favCams != null && authContext.loginStateKnown && authContext.username) {
      if (favCams.includes(camera.id)) {
        deleteFavoriteCamera(camera.id, dispatch, removeFavCam);
        setAlertMessage(<p>Removed from <a href="/my-cameras">My cameras</a></p>);

      } else {
        addFavoriteCamera(camera.id, dispatch, pushFavCam);
        setAlertMessage(<p>Saved to <a href="/my-cameras">My cameras</a></p>);
      }

      // User not logged in, save pending action and open login modal
    } else {
      toggleAuthModal('Sign In');
      dispatch(updatePendingAction({
        action: 'pushFavCam',
        payload: camera.id,
      }));
    }
  }

  function handleChildClick(e) {
    e.stopPropagation();
    setShow(!show);
  }

  /* Helpers */
  const toggleAuthModal = (action) => {
    setAuthContext((prior) => {
      if (!prior.showingModal) {
        return { ...prior, showingModal: true, action };
      }
      return prior;
    })
  };

  const shouldRenderReplay = () => {
    if (!lastUpdate) {
      return false;
    }

    const lastUpdatedDate = Date.parse(lastUpdate);
    const oneDayAgo = new Date().getTime() - 1 * 24 * 60 * 60 * 1000;

    return lastUpdatedDate > oneDayAgo;
  };

  const returnHandler = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true }); // the current entry in the history stack will be replaced with the new one with { replace: true }
    }
  };

  const handleImageSlide = index => {
    if (index === replayImages.length - 1) {
      setHasImageEnded(true); // Set state to indicate the last image
    } else {
      setHasImageEnded(false); // Reset state if it's not the last image
    }
  };

  const play = () => {
    // Pre load images for preventing strobing
    // For Firefox, Settings Performance > Use recommended performance settings
    // and Performance > Use recommended performance settings > Use hardware acceleration when available in the browser settings
    // need to be disabled
    replayImages.forEach(img => {
      const cachedImage = new Image();
      cachedImage.src = img.original;
      cachedImage.decode();
    });

    if (hasImageEnded) {
      setHasImageEnded(true);
    } else {
      setHasImageEnded(false);
    }
    if (hasImageEnded) {
      refImg.current.slideToIndex(0);
    }
  };

  const updateCameraImage = (cam) => {
    setIsUpdated(true);
    setIsLoading(true);
    setShow(true)

    // Update the image src
    if (imageRef.current) {
      imageRef.current.src = `${cam.links.imageDisplay}?ts=${new Date(cam.last_update_modified).getTime()}`;
    }
  }

  const calculateNextUpdateTime = (cam) => {
    const lastUpdateTime = new Date(cam.last_update_modified);
    const nextUpdateTime = new Date(lastUpdateTime.getTime() + cam.update_period_mean * 1000);
    const currentTimePlusUpdatePeriod = new Date(Date.now() + cam.update_period_mean * 1000);
    return nextUpdateTime < new Date() ? currentTimePlusUpdatePeriod : nextUpdateTime;
  }

  const xLargeScreen = useMediaQuery('only screen and (min-width : 992px)');

  const tooltipUpdateInterval = (
    <Tooltip id="tooltipUpdateInterval" className="tooltip-content">
      <p>
        {camera ? (
          `This camera will attempt to retrieve an updated image every ${Math.ceil(camera.update_period_mean / 60)} minutes`
        ) : (
          'Camera data is not available.'
        )}
      </p>
    </Tooltip>
  );

  /* Rendering */
  // Main component
  const loading = (showLoader || isLoading) ? 'loading' : '';
  const stale = camera?.marked_stale ? 'stale' : '';
  const delayed = camera?.marked_delayed ? 'delayed' : '';
  const unavailable = camera?.is_on ? '' : 'unavailable';
  const updated = isUpdated ? 'updated' : '';

  return (
    <div className="camera-page">
      {showNetworkError && <NetworkErrorPopup />}

      {!showNetworkError && showServerError && (
        <ServerErrorPopup setShowServerError={setShowServerError} />
      )}

      <div className="page-header">
        <Container id="back-container">
          <a
            className="back-link"
            onClick={returnHandler}
            onKeyDown={keyEvent => {
              if (keyEvent.keyCode == 13) {
                returnHandler();
              }
            }}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to last page
          </a>
        </Container>
      </div>

      {
        showLoader ?
          (<div>
            <Container className="container--full-width">
              <div className="camera-details">
                <div className='loader-container'>
                  <Spinner animation="border" className="custom-spinner" />
                  <Skeleton height={400} />
                </div>
              </div>
            </Container>
          </div>)
          :
          (
            <div>
              {camera && (
                <Container className="container--full-width">
                  <div className="camera-details">
                    <div className="camera-details__description">
                      <div className="camera-details__description__title">
                        <h2>{camera.name}</h2>
                        <button
                          className={`favourite-btn ${(favCams && favCams.includes(camera.id)) ? 'favourited' : ''}`}
                          aria-label={`${(favCams && favCams.includes(camera.id)) ? 'Remove favourite' : 'Add favourite'}`}
                          onClick={favoriteHandler}>
                          <FontAwesomeIcon icon={(favCams && favCams.includes(camera.id)) ? faStar : faStarOutline} />
                          <span>{(favCams && favCams.includes(camera.id)) ? 'Remove' : 'Save'}</span>
                        </button>

                      </div>
                      <p className="body--large">{parse(camera.caption)}</p>
                    </div>

                    <div className="camera-details__more">
                      <div className="camera-details__more__update">
                        <FontAwesomeIcon icon={faRefresh} />

                        <p className="label">
                          <span>Next update attempt</span>
                        </p>
                        <div className="camera-details__more__update-detail">
                          <p className="number">{nextUpdate}</p>
                          <OverlayTrigger placement="top" overlay={tooltipUpdateInterval}>
                              <button className="tooltip-info" aria-label="update interval tooltip" aria-describedby="tooltipUpdateInterval">?</button>
                            </OverlayTrigger>
                        </div>
                      </div>

                      <div className="camera-details__more__elevation">
                        <FontAwesomeIcon icon={faMountain} />

                        <p className="label">Elevation</p>
                        <p className="number">{camera.elevation}m</p>
                      </div>

                      {camera.highway != '0' && (
                        <div className="camera-details__more__hwy">
                          <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_17326_6048)">
                              <path fillRule="evenodd" clipRule="evenodd" d="M7.72155 2.04167V1.16667H12.558V2.04167C12.558 2.68333 13.0612 3.20833 13.6763 3.20833H18.1717L17.5007 4.5675C17.4168 4.73083 17.3777 4.9175 17.3777 5.09833V15.1958C17.4168 15.8958 17.1429 17.0333 16.0973 18.0075C15.0573 18.9758 13.1954 19.8275 9.9972 19.8275C6.79899 19.8275 4.94269 18.9758 3.89712 18.0075C2.85155 17.0333 2.57758 15.8958 2.61672 15.1958V15.1783V15.1608V5.09833C2.61672 4.91167 2.57199 4.73083 2.49371 4.5675L1.82835 3.20833H6.6033C7.21834 3.20833 7.72155 2.68333 7.72155 2.04167ZM7.21834 0C6.87727 0 6.6033 0.285833 6.6033 0.641667V2.04167H0L0.419346 2.89333L1.50405 5.10417V15.155C1.45373 16.205 1.8619 17.6808 3.15907 18.8883C4.46743 20.1075 6.62007 21.0058 10.0028 21.0058C13.3855 21.0058 15.5382 20.1075 16.8465 18.8883C18.1437 17.6808 18.5519 16.205 18.5015 15.155V5.09833L19.5918 2.89333L20.0112 2.04167H13.6874V0.641667C13.6874 0.285833 13.4135 0 13.0724 0H7.22952H7.21834ZM7.07297 7.385C7.4979 7.385 7.86693 7.41417 8.19122 7.4725C8.51552 7.53083 8.7839 7.62417 9.00196 7.75833C9.22002 7.88667 9.38216 8.06167 9.49399 8.2775C9.60581 8.49333 9.66173 8.75583 9.66173 9.07667C9.66173 9.45583 9.57786 9.77667 9.41012 10.0392C9.24238 10.3017 8.99637 10.4592 8.67766 10.5175V10.5642C8.83981 10.5992 8.98518 10.6517 9.12496 10.7217C9.26475 10.7917 9.38216 10.885 9.4884 11.0017C9.59463 11.1183 9.67291 11.27 9.73441 11.4567C9.79592 11.6375 9.82387 11.865 9.82387 12.1217C9.82387 12.4192 9.76796 12.6875 9.65614 12.9267C9.54431 13.1658 9.38776 13.37 9.18647 13.5392C8.98518 13.7083 8.73917 13.8367 8.44842 13.9242C8.15767 14.0117 7.83338 14.0525 7.47554 14.0525H5.08806V7.39083H7.07297V7.385ZM7.22952 10.0217C7.62091 10.0217 7.89488 9.9575 8.04585 9.835C8.19681 9.7125 8.27509 9.52 8.27509 9.2575C8.27509 8.995 8.18563 8.80833 8.0123 8.70333C7.83897 8.5925 7.55382 8.54 7.15684 8.54H6.44115V10.0217H7.22952ZM6.44115 11.1417V12.88H7.32457C7.73274 12.88 8.0123 12.7983 8.17445 12.635C8.33659 12.4717 8.41487 12.25 8.41487 11.9758C8.41487 11.725 8.331 11.5267 8.16886 11.375C8.00671 11.2233 7.71037 11.1475 7.27984 11.1475H6.44115V11.1417ZM13.8105 8.46417C13.2905 8.46417 12.8935 8.66833 12.6195 9.07083C12.3455 9.47333 12.2058 10.0275 12.2058 10.7333C12.2058 11.4392 12.3344 11.9933 12.586 12.3783C12.8376 12.7692 13.2457 12.9617 13.8049 12.9617C14.0621 12.9617 14.3193 12.9325 14.5821 12.8683C14.8448 12.8042 15.13 12.7167 15.4319 12.6058V13.79C15.1524 13.9067 14.8728 13.9942 14.5988 14.0525C14.3249 14.1108 14.0173 14.1342 13.6763 14.1342C13.0165 14.1342 12.4741 13.9942 12.0492 13.7083C11.6243 13.4225 11.3112 13.0258 11.1099 12.5125C10.9086 11.9992 10.8079 11.3983 10.8079 10.7158C10.8079 10.0333 10.9254 9.45 11.1546 8.93083C11.3894 8.41167 11.7249 8.00917 12.1722 7.7175C12.6139 7.42583 13.1619 7.28 13.8049 7.28C14.118 7.28 14.4367 7.32083 14.7554 7.40833C15.0741 7.49 15.3816 7.60667 15.6724 7.74667L15.2362 8.89583C14.9958 8.77917 14.7554 8.67417 14.515 8.58667C14.2745 8.49917 14.0341 8.45833 13.8049 8.45833L13.8105 8.46417Z" fill="#605E5C" />
                            </g>
                            <defs>
                              <clipPath id="clip0_17326_6048">
                                <rect width="20" height="21" fill="white" />
                              </clipPath>
                            </defs>
                          </svg>

                          <p className="label">Highway</p>
                          <p className="number">{camera.highway === '1' ? 'Trans Canada' : camera.highway}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="camera-imagery">
                    <Tabs
                      id="camera-details"
                      activeKey={activeTab}
                      onSelect={selectedTab => setActiveTab(selectedTab)}>
                      <Tab
                        eventKey="webcam"
                        title={
                          !xLargeScreen && (
                            <span>
                              <CurrentCameraIcon variant="outline" /> Current camera
                            </span>
                          )
                        }>

                        <div className="actions-bar actions-bar--webcam">
                          <div className="camera-orientations">
                            <span className="camera-direction-label">
                              <img
                                className="colocated-camera-icon"
                                src={colocatedCamIcon}
                                role="presentation"
                                alt="colocated cameras icon"
                                onClick={handleCameraImageClick}
                                style={{ cursor: "pointer" }}
                              />
                              <span>Direction</span>
                            </span>
                            <div className="camera-orientations-group">
                              {camera.camGroup.map(cam => (
                                <Button
                                  aria-label={getCameraOrientation(cam.orientation)}
                                  className={
                                    'camera-direction-btn' +
                                    (camera.id === cam.id ? ' current' : '')
                                  }
                                  key={cam.id}
                                  onClick={() => loadCamDetails(cam, true)}>
                                  {cam.orientation}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="replay-div">
                            {shouldRenderReplay() && (
                              <FontAwesomeIcon icon={faClockRotateLeft} />
                            )}

                            {shouldRenderReplay() && (
                              <Form className="replay-the-day">
                                <Form.Check
                                  onChange={toggleReplay}
                                  type="switch"
                                  id="replay-toggle"
                                  label="Replay the day"
                                />
                              </Form>
                            )}
                          </div>
                        </div>
                        <div className={`image-wrap ${updated} ${stale} ${delayed} ${unavailable} ${loading}`}>
                          <div className="card-img-box">
                              {!replay ? (
                                <>
                                  <img
                                    ref={imageRef}
                                    src={camera.links.imageDisplay}
                                    alt={camera.name}
                                    onLoad={() => setIsLoading(false)}
                                    style={{ display: showLoader || isLoading || unavailable ? 'none' : 'block' }}
                                  />

                                  {(isLoading) ? <Skeleton height={400} /> : null}

                                  {!unavailable && !stale && !delayed && updated && (
                                    <div className="card-notification">
                                      {showLoader ? <Skeleton /> : !isLoading && (
                                        <>
                                          <div className={'card-banner' + (show ? ' hidden' : ' bounce')}>
                                            <FontAwesomeIcon icon={faArrowsRotate} />
                                            <p>Image automatically updated to show the latest image received.</p>
                                            <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
                                          </div>
                                          <div className={'card-pill' + (show ? ' bounce' : ' hidden')}
                                            onClick={handleChildClick}
                                            onKeyDown={keyEvent => {
                                              if (keyEvent.keyCode === 13) {
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
                                      {showLoader ? <Skeleton /> : !isLoading && (
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
                                              if (keyEvent.keyCode === 13) {
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
                                      {showLoader ? <Skeleton /> : !isLoading && (
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
                                              if (keyEvent.keyCode === 13) {
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

                                  {unavailable && !showLoader && !isLoading && (
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

                          {!replay && (
                            <div className="timestamp">
                              <svg width="70" height="14" viewBox="0 0 70 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.84543 3.44859C3.84543 2.18472 3.7466 1.80479 2.94781 1.69624L2.52784 1.64196C2.37137 1.54892 2.3549 1.26203 2.5443 1.19224C4.17482 1.0992 5.73123 1.04492 7.36174 1.04492C8.99226 1.04492 10.3346 1.15348 11.5863 1.58769C14.1803 2.47161 15.4814 4.53411 15.4814 6.92227C15.4814 9.31043 14.312 11.1868 12.1215 12.3111C10.8698 12.9469 9.29696 13.1796 7.8229 13.1796C6.5959 13.1796 5.36889 13.0322 4.69362 13.0322C3.8866 13.0322 3.19486 13.0477 2.29725 13.0865C2.18196 13.0322 2.14079 12.7453 2.25608 12.6368L2.70077 12.5825C3.81249 12.4352 3.85366 12.2258 3.85366 10.3262V3.45634L3.84543 3.44859ZM5.4183 9.89972C5.4183 10.8612 5.47594 11.435 5.80534 11.8692C6.22532 12.4274 6.95823 12.6058 8.16877 12.6058C11.891 12.6058 13.5627 10.3107 13.5627 6.95329C13.5627 4.96833 12.5498 1.60319 7.51821 1.60319C6.38179 1.60319 5.7724 1.75051 5.61594 1.85907C5.45948 1.96762 5.42653 2.41734 5.42653 3.23148V9.89972H5.4183Z" fill="white" />
                                <path d="M17.6553 7.83599C17.6553 7.1304 17.6553 7.04511 17.1365 6.71169L16.9636 6.60314C16.8895 6.53336 16.8895 6.33176 16.9801 6.27749C17.4248 6.13016 18.4377 5.66494 18.9235 5.39355C19.0223 5.40906 19.08 5.44783 19.08 5.51761V6.56437C19.08 6.65742 19.0965 6.71169 19.1376 6.7272C19.8129 6.2077 20.5376 5.64168 21.2458 5.64168C21.7234 5.64168 22.1104 5.92856 22.1104 6.36277C22.1104 6.95981 21.5916 7.19243 21.287 7.19243C21.0976 7.19243 20.9987 7.13815 20.867 7.06837C20.5787 6.89003 20.2905 6.77373 20.027 6.77373C19.7223 6.77373 19.4917 6.93655 19.3353 7.13815C19.1459 7.39402 19.0882 7.91353 19.0882 8.53383V10.9918C19.0882 12.2944 19.1212 12.5115 19.8541 12.5658L20.5458 12.6201C20.6776 12.7131 20.6446 13.0155 20.5046 13.0698C19.5988 13.031 19.0471 13.0155 18.3718 13.0155C17.6965 13.0155 17.1036 13.031 16.6013 13.0698C16.4695 13.0155 16.4283 12.7054 16.5601 12.6201L16.9307 12.5658C17.6389 12.4572 17.6553 12.2944 17.6553 10.9918V7.82824V7.83599Z" fill="white" />
                                <path d="M24.029 7.8367C24.029 7.13111 24.029 7.04582 23.5102 6.71241L23.3372 6.60385C23.2631 6.53407 23.2631 6.33247 23.3537 6.2782C23.7984 6.13088 24.8936 5.66565 25.3301 5.39427C25.4289 5.39427 25.503 5.43304 25.5195 5.50282C25.4783 6.13863 25.4372 6.9993 25.4372 7.74366V10.9925C25.4372 12.2951 25.4783 12.4734 26.1701 12.5665L26.5736 12.6208C26.7053 12.7138 26.6724 13.0162 26.5324 13.0705C25.9559 13.0317 25.4042 13.0162 24.7289 13.0162C24.0537 13.0162 23.4608 13.0317 22.9255 13.0705C22.7937 13.0162 22.7526 12.7061 22.8843 12.6208L23.2878 12.5665C23.996 12.4734 24.0207 12.2951 24.0207 10.9925V7.82895L24.029 7.8367ZM25.6266 2.68821C25.6266 3.33952 25.1489 3.62641 24.6054 3.62641C24.0125 3.62641 23.6255 3.20771 23.6255 2.72697C23.6255 2.12993 24.0866 1.75 24.6631 1.75C25.2395 1.75 25.6183 2.18421 25.6183 2.68821H25.6266Z" fill="white" />
                                <path d="M28.6575 7.69696C28.3692 7.03013 28.1963 6.4486 27.5046 6.36331L27.1258 6.30903C27.0105 6.16171 27.0269 5.91359 27.1834 5.85932C27.661 5.89033 28.3363 5.91359 28.9869 5.91359C29.5057 5.91359 29.8927 5.89033 30.5433 5.85932C30.675 5.9291 30.6915 6.22374 30.5597 6.30903L30.3292 6.34781C29.7362 6.44085 29.7115 6.52614 29.9092 7.0689C30.3539 8.31726 30.9056 9.58112 31.3503 10.5193C31.5232 10.8838 31.5973 11.0466 31.655 11.1009C31.7291 11.0466 31.8691 10.7907 32.0173 10.4108C32.2644 9.79823 32.9232 8.22421 33.1126 7.75123C33.3843 7.11543 33.4584 6.73549 33.4584 6.62694C33.4584 6.46411 33.3431 6.39433 33.1126 6.35556L32.6679 6.30128C32.5526 6.17722 32.5691 5.92135 32.7091 5.85156C33.302 5.88258 33.7796 5.90584 34.1502 5.90584C34.6278 5.90584 34.9572 5.88258 35.4925 5.85156C35.6242 5.92135 35.6489 6.19273 35.5336 6.30128L35.2454 6.34005C34.5701 6.4331 34.3972 6.89832 33.8455 7.91406C33.5737 8.40255 32.3879 11.0233 32.075 11.7677C31.8856 12.2174 31.6962 12.6361 31.4409 13.2487C31.3997 13.3029 31.3256 13.3184 31.2515 13.3184C31.1527 13.3184 31.0621 13.3029 31.0044 13.2487C30.848 12.7447 30.5597 12.0391 30.2797 11.3645L28.6657 7.69696H28.6575Z" fill="white" />
                                <path d="M37.4024 8.39425C36.9 8.39425 36.8836 8.43301 36.8836 8.88273C36.8836 10.7126 38.0118 12.2634 40.0705 12.2634C40.7046 12.2634 41.2399 12.085 41.8328 11.3794C42.0222 11.3252 42.1539 11.4337 42.1786 11.5965C41.5445 12.8294 40.1611 13.2791 39.1647 13.2791C37.9129 13.2791 36.933 12.7751 36.3812 12.085C35.8048 11.3794 35.5742 10.5265 35.5742 9.73565C35.5742 7.51032 37.1306 5.64941 39.4364 5.64941C41.0834 5.64941 42.1622 6.71943 42.1622 7.80496C42.1622 8.06083 42.121 8.2004 42.0881 8.27794C42.0304 8.38649 41.7587 8.402 40.9516 8.402H37.4024V8.39425ZM38.5964 7.85148C40.0128 7.85148 40.4411 7.7817 40.5893 7.67315C40.6469 7.63438 40.7046 7.56459 40.7046 7.33198C40.7046 6.82798 40.3422 6.19218 39.2305 6.19218C38.1188 6.19218 37.1142 7.16915 37.0977 7.76619C37.0977 7.80496 37.0977 7.85923 37.2294 7.85923H38.5882L38.5964 7.85148Z" fill="white" />
                                <path d="M44.9625 3.44859C44.9625 2.10719 44.8884 1.76602 44.0238 1.69624L43.4061 1.64196C43.2579 1.53341 43.2744 1.26203 43.4308 1.19224C44.4684 1.0992 45.7696 1.04492 47.5566 1.04492C48.7671 1.04492 49.92 1.13797 50.7846 1.54892C51.6081 1.92885 52.2422 2.64995 52.2422 3.80526C52.2422 5.10789 51.4352 5.77472 50.2823 6.27871C50.2823 6.45705 50.4388 6.51132 50.6447 6.55009C51.6823 6.72843 53.2222 7.63562 53.2222 9.5663C53.2222 11.6598 51.567 13.071 48.1165 13.071C47.5566 13.071 46.6178 13.0167 45.8107 13.0167C45.0037 13.0167 44.312 13.0555 43.6038 13.071C43.4885 13.0167 43.4473 12.7298 43.5626 12.6213L43.9085 12.567C44.9296 12.4042 44.9625 12.2103 44.9625 10.3107V3.44084V3.44859ZM46.5354 5.85225C46.5354 6.35625 46.5519 6.39502 47.5318 6.35625C49.4918 6.28646 50.5458 5.7437 50.5458 4.03787C50.5458 2.33204 49.1459 1.59544 47.6883 1.59544C47.2683 1.59544 46.9801 1.63421 46.8072 1.70399C46.6178 1.75827 46.5354 1.85131 46.5354 2.17697V5.8445V5.85225ZM46.5354 10.047C46.5354 10.6984 46.5766 11.621 46.9389 12.0165C47.3013 12.4352 47.8777 12.5205 48.4542 12.5205C50.167 12.5205 51.4682 11.7994 51.4682 9.99276C51.4682 8.56607 50.7023 6.89901 47.6471 6.89901C46.6095 6.89901 46.5354 7.00756 46.5354 7.37199V10.047Z" fill="#FDB913" />
                                <path d="M57.027 2.34677C58.4269 1.31552 60.2139 0.811523 62.2067 0.811523C63.2443 0.811523 64.7019 1.01312 65.6078 1.24573C65.8383 1.30001 65.9701 1.33878 66.143 1.31552C66.1595 1.73422 66.2583 2.87402 66.4148 3.97506C66.316 4.09912 66.0278 4.12238 65.896 4.00607C65.6078 2.78098 64.7431 1.36979 61.9597 1.36979C59.0198 1.36979 56.5246 3.12214 56.5246 6.86721C56.5246 10.6123 59.0775 12.7601 62.2232 12.7601C64.7019 12.7601 65.7972 11.2403 66.2336 10.1781C66.3654 10.085 66.6536 10.1238 66.7359 10.2478C66.6042 11.1861 66.1019 12.3801 65.8136 12.7213C65.5831 12.7601 65.3525 12.8298 65.1384 12.8996C64.7184 13.047 63.3349 13.3183 62.1079 13.3183C60.3786 13.3183 58.7316 12.9927 57.3234 12.1087C55.7917 11.1163 54.5977 9.47247 54.5977 7.13859C54.5977 5.13037 55.5611 3.41679 57.0187 2.34677H57.027Z" fill="#FDB913" />
                              </svg>
                              <FriendlyTime
                                date={lastUpdate}
                                includeFullIfHumanized
                              />
                            </div>
                          )}
                        </div>
                        <p
                          className={'credit' + (replay ? ' under-replay' : ' ')}
                          dangerouslySetInnerHTML={{ __html: camera.credit }}></p>
                      </Tab>

                      <Tab
                        eventKey="nearby"
                        title={
                          !xLargeScreen && (
                            <span>
                              <FontAwesomeIcon icon={faFlag} />
                              Nearby
                            </span>
                          )
                        }>
                        <div className="actions-bar actions-bar--nearby"></div>
                        <div className="map-wrap map-context-wrap">
                          <DndProvider options={HTML5toTouch}>
                            <MapWrapper
                              referenceData={{ ...camera, type: 'camera' }}
                              isCamDetail={true}
                              mapViewRoute={mapViewRoute}
                              loadCamDetails={loadCamDetails}
                            />
                          </DndProvider>
                        </div>
                      </Tab>
                    </Tabs>
                  </div>
                </Container>
              )}
            </div>
          )
      }

      <PollingComponent runnable={() => updateCamera()} interval={30000} />

      {activeTab === 'webcam' && <Footer replay={replay} />}
    </div>
  );
}
