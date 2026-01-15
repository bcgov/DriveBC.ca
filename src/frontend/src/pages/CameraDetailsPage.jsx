// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Env Variables
import { API_HOST, REPLAY_THE_DAY } from "../env.js";

// Routing
import { createSearchParams, useParams, useNavigate, useSearchParams } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { pushFavCam, removeFavCam, updatePendingAction } from '../slices/userSlice';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBackwardStep,
  faCircleInfo,
  faHourglassClock,
  faForwardStep,
  faPause,
  faPlay,
  faStar,
  faVideoCamera,
  faVideoSlash,
  faWarning,
  faXmark,
  faMapPin
} from '@fortawesome/pro-solid-svg-icons';
import { faStar as faStarOutline, faMountain, faRefresh, faFlag, faVideoCamera as faVideoOutline } from '@fortawesome/pro-regular-svg-icons';
import { faArrowsRotate } from '@fortawesome/pro-solid-svg-icons';
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import { useMediaQuery } from '@uidotdev/usehooks';
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
import Skeleton from 'react-loading-skeleton'
import Spinner from 'react-bootstrap/Spinner';

// Internal imports
import { AlertContext, AuthContext } from '../App';
import {
  addFavoriteCamera,
  deleteFavoriteCamera,
  getCameraGroupMap,
  getCameras,
} from '../Components/data/webcams.js';
import { getFullOrientation } from '../Components/cameras/helper.js';
import { getWebcamReplay } from '../Components/data/webcams';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components/map/errors/NetworkError';
import ServerErrorPopup from '../Components/map/errors/ServerError';
import MapWrapper from '../Components/map/MapWrapper';
import Footer from '../Footer';
import trackEvent from '../Components/shared/TrackEvent';
import PollingComponent from '../Components/shared/PollingComponent';
import NearbyWeathers from "../Components/cameras/nearbyweathers/NearbyWeathers";
import CameraOrientations from "../Components/cameras/directions/CameraOrientations";

// Styling
import './CameraDetailsPage.scss';
import '../Components/map/Map.scss';
import './ContainerSidePanel.scss';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import 'react-loading-skeleton/dist/skeleton.css'

export default function CameraDetailsPage() {
  /* Setup */
  // Misc
  let cameraGroupMap = {};

  // Navigation
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

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
  const referenceDataInitialized = useRef(false);
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

  // Reference data
  const getReferenceParams = () => {
    referenceDataInitialized.current = true;

    // Use current cam if no reference data and map params are not set
    if (!searchParams.get('type')) {
      return {
        ...camera,
        type: 'camera',
        focusCamera: true,
        pan: searchParams.get('pan'),
        zoom: searchParams.get('zoom'),
      };
    }

    return {
      type: searchParams.get('type'),
      id: searchParams.get('id'),
      display_category: searchParams.get('display_category'),
    };
  }
  const [referenceData, setReferenceData] = useState({});

  // Effects
  useEffect(() => {
    if (searchParams && camera && !referenceDataInitialized.current) {
      setReferenceData(getReferenceParams());
    }
  }, [searchParams, camera]);

  useEffect(() => {
    const scrollableContainer = document.querySelector('#main');
    scrollableContainer.scrollTo(0, 0);
  }, []);

  const pauseReplay = () => {
    const pauseIcon = document.querySelectorAll(".fa-pause");
    if (pauseIcon.length > 0) {
      pauseIcon[0].parentElement.click();
    }
  };

  // Error handling
  const displayError = error => {
    if (error instanceof ServerError) {
      setShowServerError(true);
    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  };

  // Data functions
  const loadCamDetails = (camData) => {
    // Do nothing when data is unchanged
    if (viewedCamera.current && viewedCamera.current.id === camData.id) {
      return;
    }

    // Camera data
    setIsUpdated(false);
    viewedCamera.current = { id: camData.id, last_update_modified: camData.last_update_modified };

    setCamera(camData);
    pauseReplay();

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

    if (!isInitialMount.current) {
      const params = new URLSearchParams(window.location.search);
      params.delete('type');
      params.delete('id');
      params.delete('display_category');
      navigate(`/cameras/${camData.id}?${params.toString()}`, { replace: true });
    }

    // Set camera group data
    setCameraGroup(camData.camGroup);
    cameraGroupRefs.current = new Set(camData.camGroup.map(cam => cam.id));

    // DBC22-4282: switch tab back to cameras on changing camera
    setActiveTab('webcam');

    // DBC22-5236: reset replay controls
    setReplay(false);

    setShowLoader(false);
    isInitialMount.current = false;
  };

  async function initCamera(id) {
    const allCameras = await getCameras().catch(error => displayError(error));
    cameraGroupMap = getCameraGroupMap(allCameras);

    const camData = await getCameras(
      null,
      `${API_HOST}/api/webcams/${id}/`,
    ).catch(error => displayError(error));

    // Group cameras
    const group = cameraGroupMap[camData.group];
    camData.camGroup = group;
    camData.camGroup.forEach(cam => (cam.camGroup = group));

    loadCamDetails(camData);
  }

  const updateCamera = async () => {
    isUpdate.current = true;

    const group = [];

    for (const cameraId of cameraGroupRefs.current) {
      const camData = await getCameras(
        null,
        `${API_HOST}/api/webcams/${cameraId}/`,
      ).catch(error => displayError(error));

      if (camData) {
        group.push(camData);
      }
    }

    const camData = group.find(cam => cam.id === viewedCamera.current.id);
    camData.camGroup = group;
    camData.camGroup.forEach(cam => (cam.camGroup = group));

    setCameraGroup(camData.camGroup);
    setCamera(camData);

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
      if (cam.https_cam) {
        return { original: `${window.location.origin}/images/replaytheday/${cam.id}/${url}.jpg` };
      } else {
        return { original: `${REPLAY_THE_DAY}${cam.id}/${url}.jpg` };
      }
    });
    setReplayImages(replayImages);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      initCamera(params.id);

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

  const mapViewRoute = (id) => {
    navigate({
      pathname: '/',
      search: `?${createSearchParams({
        type: "camera",
        camIndex: [...cameraGroupRefs.current].indexOf(id),
        id,
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
      toggleAuthModal('Sign in');
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
    setShow(true);

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

  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

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
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError && (
        <ServerErrorPopup setShowServerError={setShowServerError} />
      )}

      <div className="page-header">
        <Container id="back-container">
          <a
            className="back-link"
            onClick={returnHandler}
            onKeyDown={keyEvent => {
              if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                returnHandler();
              }
            }}
            tabIndex={0}>
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
                <Container className="container--sidepanel">
                  <div className="container--sidepanel__left camera-details">
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

                    {largeScreen &&
                    <div className="camera-details__more">
                      <div className="camera-details__more__update">
                        <div className="camera-details__more__title label">
                          <FontAwesomeIcon icon={faRefresh} />
                          <span>Next update attempt</span>
                        </div>
                        <div className="camera-details__more__update-detail">
                          <p className="number">{nextUpdate}</p>
                          <OverlayTrigger placement="top" overlay={tooltipUpdateInterval}>
                              <button className="tooltip-info" aria-label="update interval tooltip" aria-describedby="tooltipUpdateInterval">?</button>
                            </OverlayTrigger>
                        </div>
                      </div>

                      <div className="camera-details__more__elevation">
                        <div className="camera-details__more__title label">
                          <FontAwesomeIcon icon={faMountain} />
                          <span>Elevation</span>
                        </div>
                        <p className="number">{camera.elevation}m</p>
                      </div>

                      {camera.highway != '0' && (
                        <div className="camera-details__more__hwy">
                          <div className="camera-details__more__title label">
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

                            <span>Highway</span>
                          </div>
                          <p className="number">{camera.highway === '1' ? 'Trans Canada' : camera.highway}</p>
                        </div>
                      )}
                    </div>
                    }
                  </div>

                  {largeScreen && (
                    <div className="container--sidepanel__right camera-imagery">
                      <div className="camera-imagery__details d-flex">
                        <div className="camera-imagery__details__left flex-grow-1">
                          <div className="actions-bar actions-bar--webcam">
                            <div className="camera-orientations">
                              <span className="camera-direction-label">
                                <FontAwesomeIcon
                                  className="colocated-camera-icon"
                                  icon={faVideoCamera}
                                  role="presentation"
                                  alt="colocated cameras icon" />

                                <span>{getFullOrientation(camera.orientation)}</span>
                              </span>
                            </div>
                          </div>
                          <div className={`image-wrap ${updated} ${stale} ${delayed} ${unavailable} ${loading} ${replay ? 'replay' : ''}`}>
                            {shouldRenderReplay() && (
                              <div className={`replay-div ${replay ? 'replay-on' : 'replay-off'}`}>
                                <Form className="replay-the-day">
                                  <Form.Check
                                    onChange={toggleReplay}
                                    type="switch"
                                    id="replay-toggle"
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
                          </div>
                          <p
                            className={'credit' + (replay ? ' under-replay' : ' ')}
                            dangerouslySetInnerHTML={{ __html: camera.credit }}>
                          </p>
                        </div>
                        <div className="camera-imagery__details__right">
                          <CameraOrientations camData={camera} loadCamDetails={loadCamDetails} />
                        </div>
                      </div>
                      <div className="camera-imagery__nearby d-flex">
                        <div className="camera-imagery__nearby__left flex-grow-1">
                          <div className="actions-bar actions-bar--nearby">
                            <span className="title">
                              <FontAwesomeIcon icon={faMapPin}/>
                              <span>Area map</span>
                            </span>
                          </div>
                          <div className="map-wrap map-context-wrap">
                            <DndProvider options={HTML5toTouch}>
                              {referenceDataInitialized.current &&
                                <MapWrapper
                                  referenceData={referenceData}
                                  rootCamera={camera}
                                  isCamDetail={true}
                                  mapViewRoute={() => mapViewRoute(camera.id)}
                                  loadCamDetails={loadCamDetails}
                                />
                              }
                            </DndProvider>
                          </div>
                        </div>

                        <div className="camera-imagery__nearby__right">
                          {camera &&
                            <React.Fragment>
                              <NearbyWeathers camera={camera}/>
                            </React.Fragment>
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {!largeScreen && (
                    <div className="container--sidepanel__right camera-imagery">
                      <Tabs
                        className="mobile-tabs"
                        activeKey={activeTab}
                        onSelect={selectedTab => setActiveTab(selectedTab)}>
                        <Tab
                          eventKey="webcam"
                          title={
                            !largeScreen && (
                              <span>
                                  <FontAwesomeIcon icon={faVideoOutline} /><span>Details</span>
                                </span>
                              )
                            }>
                            <div className="camera-details__more">
                              <div className="camera-details__more__update">
                                <div className="camera-details__more__title label">
                                  <FontAwesomeIcon icon={faRefresh} />
                                  <span>Next update attempt</span>
                                </div>
                                <div className="camera-details__more__update-detail">
                                  <p className="number">{nextUpdate}</p>

                                  <OverlayTrigger placement="top" overlay={tooltipUpdateInterval}>
                                    <button className="tooltip-info" aria-label="update interval tooltip" aria-describedby="tooltipUpdateInterval">?</button>
                                  </OverlayTrigger>
                                </div>
                              </div>

                              <div className="camera-details__more__elevation">
                                <div className="camera-details__more__title label">
                                  <FontAwesomeIcon icon={faMountain} />
                                  <span>Elevation</span>
                                </div>
                                <p className="number">{camera.elevation}m</p>
                              </div>

                              {camera.highway != '0' && (
                                <div className="camera-details__more__hwy">
                                  <div className="camera-details__more__title label">
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_24152_13866)">
                                      <path fillRule="evenodd" clipRule="evenodd" d="M6.24 1.78V1.14H9.97V1.78C9.97 2.25 10.36 2.64 10.83 2.64H14.3L13.78 3.64C13.72 3.76 13.69 3.9 13.69 4.03V11.45C13.72 11.96 13.51 12.8 12.7 13.52C11.9 14.23 10.46 14.86 7.99 14.86C5.52 14.86 4.09 14.23 3.28 13.52C2.47 12.8 2.26 11.97 2.29 11.45V4.03C2.29 3.89 2.26 3.76 2.2 3.64L1.69 2.64H5.38C5.85 2.64 6.24 2.25 6.24 1.78ZM5.77 0C5.5 0 5.28 0.22 5.28 0.49V1.56H0L0.34 2.21L1.21 3.89V11.55C1.17 12.35 1.5 13.47 2.53 14.39C3.58 15.32 5.3 16 8 16C10.7 16 12.43 15.32 13.47 14.39C14.51 13.47 14.83 12.35 14.79 11.55V3.88L15.66 2.2L16 1.55H10.94V0.49C10.94 0.22 10.72 0 10.45 0H5.77ZM5.66 5.63C6 5.63 6.29 5.65 6.55 5.7C6.81 5.74 7.02 5.82 7.2 5.92C7.37 6.02 7.5 6.15 7.59 6.32C7.68 6.48 7.72 6.68 7.72 6.93C7.72 7.22 7.65 7.46 7.52 7.66C7.39 7.86 7.19 7.98 6.93 8.02V8.06C7.06 8.09 7.18 8.13 7.29 8.18C7.4 8.23 7.5 8.3 7.58 8.39C7.66 8.48 7.73 8.59 7.78 8.74C7.83 8.88 7.85 9.05 7.85 9.25C7.85 9.48 7.81 9.68 7.72 9.86C7.63 10.04 7.51 10.2 7.34 10.33C7.18 10.46 6.98 10.56 6.75 10.62C6.52 10.69 6.26 10.72 5.97 10.72H4.06V5.65H5.65L5.66 5.63ZM5.78 7.63C6.09 7.63 6.31 7.58 6.43 7.49C6.55 7.4 6.61 7.25 6.61 7.05C6.61 6.85 6.54 6.71 6.4 6.63C6.26 6.55 6.03 6.51 5.72 6.51H5.15V7.64H5.78V7.63ZM5.15 8.49V9.81H5.86C6.19 9.81 6.41 9.75 6.54 9.62C6.67 9.5 6.73 9.33 6.73 9.12C6.73 8.93 6.66 8.78 6.53 8.66C6.4 8.54 6.16 8.49 5.82 8.49H5.15ZM11.04 6.45C10.62 6.45 10.31 6.61 10.09 6.91C9.87 7.22 9.76 7.64 9.76 8.18C9.76 8.72 9.86 9.14 10.06 9.43C10.26 9.73 10.59 9.87 11.03 9.87C11.24 9.87 11.44 9.85 11.65 9.8C11.86 9.75 12.09 9.68 12.33 9.6V10.5C12.11 10.59 11.88 10.66 11.66 10.7C11.44 10.74 11.2 10.76 10.92 10.76C10.39 10.76 9.96 10.65 9.62 10.44C9.28 10.22 9.03 9.92 8.87 9.53C8.71 9.14 8.63 8.68 8.63 8.16C8.63 7.64 8.72 7.2 8.91 6.8C9.1 6.4 9.37 6.1 9.72 5.88C10.07 5.66 10.51 5.55 11.03 5.55C11.28 5.55 11.54 5.58 11.79 5.65C12.04 5.71 12.29 5.8 12.52 5.91L12.17 6.79C11.98 6.7 11.79 6.62 11.59 6.55C11.4 6.48 11.21 6.45 11.02 6.45H11.04Z" fill="#605E5C"/>
                                    </g>
                                    <defs>
                                    <clipPath id="clip0_24152_13866">
                                      <rect width="16" height="16" fill="white"/>
                                    </clipPath>
                                    </defs>
                                  </svg>
                                    <span>Highway</span>
                                  </div>
                                  <p className="number">{camera.highway === '1' ? 'Trans Canada' : camera.highway}</p>
                                </div>
                              )}
                            </div>
                            <div className="camera-imagery__details d-flex">
                              <div className="camera-imagery__details__left flex-grow-1">
                                <div className="actions-bar actions-bar--webcam">
                                  <div className="camera-orientations">
                                    <span className="camera-direction-label">
                                      <FontAwesomeIcon
                                        className="colocated-camera-icon"
                                        icon={faVideoCamera}
                                        role="presentation"
                                        alt="colocated cameras icon" />

                                      <span>{getFullOrientation(camera.orientation)}</span>
                                    </span>
                                  </div>
                                </div>
                                <div className={`image-wrap ${updated} ${stale} ${delayed} ${unavailable} ${loading}  ${replay ? 'replay' : ''}`}>
                                  {shouldRenderReplay() && (
                                    <div className={`replay-div ${replay ? 'replay-on' : 'replay-off'}`}>
                                      <Form className="replay-the-day">
                                        <Form.Check
                                          onChange={toggleReplay}
                                          type="switch"
                                          id="replay-toggle"
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
                                </div>
                                <p
                                  className={'credit' + (replay ? ' under-replay' : ' ')}
                                  dangerouslySetInnerHTML={{ __html: camera.credit }}>
                                </p>
                              </div>
                              <div className="camera-imagery__details__right">
                                <CameraOrientations camData={camera} loadCamDetails={loadCamDetails} />
                              </div>
                            </div>
                            {camera &&
                              <React.Fragment>
                                <NearbyWeathers camera={camera} />
                              </React.Fragment>
                            }
                          </Tab>
                          <Tab
                            eventKey="nearby"
                            title={
                              !largeScreen && (
                                <span>
                                  <FontAwesomeIcon icon={faFlag} />
                                  Nearby
                                </span>
                              )
                            }>
                            <div className="camera-imagery__nearby d-flex">
                              <div className="camera-imagery__nearby__right flex-grow-1">
                                <div className="actions-bar actions-bar--nearby">
                                  <span className="title">
                                    <FontAwesomeIcon icon={faMapPin} />
                                    <span>Area map</span>
                                  </span>
                                </div>
                                <div className="map-wrap map-context-wrap">
                                  <DndProvider options={HTML5toTouch}>
                                    {referenceDataInitialized.current &&
                                      <MapWrapper
                                        referenceData={referenceData}
                                        rootCamera={camera}
                                        isCamDetail={true}
                                        mapViewRoute={() => mapViewRoute(camera.id)}
                                        loadCamDetails={loadCamDetails}
                                      />
                                    }
                                  </DndProvider>
                                </div>
                              </div>
                            </div>
                          </Tab>
                        </Tabs>
                    </div>
                  )}
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
