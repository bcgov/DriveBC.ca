// React
import React, {useEffect, useRef, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faExclamationTriangle,
  faVideoSlash,
  faPlay,
  faPause,
  faBackward,
  faForward,
  faClockRotateLeft,
  faFlag
} from '@fortawesome/pro-solid-svg-icons';
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Button from 'react-bootstrap/Button';
import ImageGallery from 'react-image-gallery';
import parse from 'html-react-parser';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import {useMediaQuery} from '@uidotdev/usehooks';

// Internal imports
import { getCameraGroupMap, getCameras } from '../Components/data/webcams.js';
import { getWebcamReplay } from '../Components/data/webcams';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Map from '../Components/Map.js';
import Footer from '../Footer.js';
import FriendlyTime from '../Components/FriendlyTime';
import highwayShield from '../Components/highwayShield';
import CurrentCameraIcon from '../Components/CurrentCameraIcon';
import { getCameraOrientation } from '../Components/cameras/helper.js';

// Styling
import './CameraDetailsPage.scss';
import '../Components/Map.scss';

import colocatedCamIcon from '../images/colocated-camera.svg';

export default function CameraDetailsPage() {
  const navigate = useNavigate();

  // Context and router data
  const params = useParams();

  // Refs
  const isInitialMount = useRef(true);

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

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  // Data functions
  const loadCamDetails = (camData) => {
    // Camera data
    setCamera(camData);

    // Next update time
    const currentTime = new Date();
    const nextUpdateTime = currentTime.setSeconds(currentTime.getSeconds() + camData.update_period_mean);
    const nextUpdateTimeFormatted = new Intl.DateTimeFormat('en-US',
        {hour: 'numeric',
          minute: 'numeric',
          timeZoneName: 'short'},
    ).format(nextUpdateTime);
    setNextUpdate(nextUpdateTimeFormatted);

    // Last update time
    setLastUpdate(camData.last_update_modified);

    // Replace window title and URL
    document.title = `DriveBC - Cameras - ${camData.name}`;
    window.history.replaceState(history.state, null, `/cameras/${camData.id}`)
  }

  async function initCamera(id) {
    const allCameras = await getCameras().catch((error) => displayError(error));
    const cameraGroupMap = getCameraGroupMap(allCameras);

    const camData = await getCameras(null, `${window.API_HOST}/api/webcams/${id}/`).catch((error) => displayError(error));

    // Group cameras
    const group = cameraGroupMap[camData.group];
    camData.camGroup = group;
    camData.camGroup.forEach((cam) => cam.camGroup = group);

    loadCamDetails(camData);
  }

  const loadReplay = async (cam) => {
    const replayImageList = await getWebcamReplay(cam);
    const replayImages = replayImageList.map((url) => {
      return {original: `${window.REPLAY_THE_DAY}${camera.id}/${url}.jpg`};
    });
    setReplayImages(replayImages);
  }

  useEffect(() => {
    if (isInitialMount.current) {
      initCamera(params.id);
      isInitialMount.current = false;

    } else if (camera) {
      loadReplay(camera);
    }
  }, [camera]);

  const toggleReplay = () => {
    setReplay(!replay);
  };

  const mapViewRoute = () =>{
    navigate("/", { state: camera })
  }

  // ReplayTheDay
  const refImg = useRef(null);

  const customControls = () => {
    return refImg.current && (
      <div className="range-slider-container">
        <RangeSlider
          value={refImg.current.getCurrentIndex()}
          max={replayImages.length}
          tooltip='off'
          onChange={(e) =>
            refImg.current.slideToIndex(parseInt(e.target.value))
          }
        />
      </div>
    );
  };

  // Component functions
  const customLeftNav = (onClick, disabled) => {
    return (
      <div className="replay-control replay-control--backward">
        <Button className="replay-btn replay-backward" onClick={onClick} disabled={disabled} aria-label='rewind' >
          <FontAwesomeIcon icon={faBackward} />
        </Button>
      </div>
    );
  };

  const customPlayPause = (onClick, isPlaying) => {
    return (
      <div className="replay-control replay-control--play">
        <Button className="replay-btn replay-play" onClick={onClick} isPlaying={isPlaying} aria-label={isPlaying ? "pause" : "play"} >
          {isPlaying ? <FontAwesomeIcon icon={faPause} /> : <FontAwesomeIcon icon={faPlay} />}
        </Button>
      </div>
    );
  };

  const customRightNav = (onClick, disabled) => {
    return (
      <div className="replay-control replay-control--forward">
        <Button className="replay-btn replay-forward" onClick={onClick} disabled={disabled} aria-label='fastforward' >
          <FontAwesomeIcon icon={faForward} />
        </Button>
      </div>
    );
  };

  // Helper functions
  const shouldRenderReplay = () => {
    if (!lastUpdate) {
      return false
    }

    const lastUpdatedDate = Date.parse(lastUpdate);
    const oneDayAgo = new Date().getTime() - (1 * 24 * 60 * 60 * 1000);

    return lastUpdatedDate > oneDayAgo;
  };

  const returnHandler = () => {
    if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
    } else {
        navigate('/', { replace: true }); // the current entry in the history stack will be replaced with the new one with { replace: true }
    }
  }

  const handleImageSlide = (index) => {
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
    replayImages.forEach((img) => {
      const cachedImage = new Image();
      cachedImage.src = img.original;
      cachedImage.decode();
    });

    if(hasImageEnded){
      setHasImageEnded(true);
    }
    else{
      setHasImageEnded(false);
    }
    if(hasImageEnded){
      refImg.current.slideToIndex(0);
    }
  };

  const xLargeScreen = useMediaQuery('only screen and (min-width : 992px)');

  // Rendering
  return (
    <div className="camera-page">
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

      <div className="page-header">
        <Container>
          <a className="back-link"
            onClick={returnHandler}
            onKeyDown={(keyEvent) => {
              if (keyEvent.keyCode == 13) {
                returnHandler();
              }
            }}>

            <FontAwesomeIcon icon={faArrowLeft} />
            Back to last page
          </a>
        </Container>
      </div>
      <div>
        {camera && (
          <div className="container--full-width">
            <div className="camera-details">
              <div className="camera-details__description">
                <h2>{camera.name}</h2>
                <p className="body--large">{parse(camera.caption)}</p>
              </div>
              <div className="camera-details__more">
                {camera.highway != '0' &&
                  <div className="camera-details__more__hwy">
                    {highwayShield(camera.highway)}
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                }

                <div className="camera-details__more__elevation">
                  <p className="elevation">
                    <span className="number">{camera.elevation}</span>m
                  </p>
                  <p className="label--more">Elevation</p>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            {camera.is_on && camera.marked_stale && !camera.marked_delayed && (
              <div className="camera-message stale">
                <p className="bold">
                  Unable to retrieve the latest image, we`re displaying last
                  image received.
                </p>
              </div>
            )}

            {camera.is_on && camera.marked_delayed && (
              <div className="camera-message delayed">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <p className="bold">
                  There is a significant delay in receiving a new image from the
                  camera.
                </p>
                <p>This is sometimes due to:</p>
                <ul>
                  <li>Intermittent data signals in the areas</li>
                  <li>Disruptions from weather</li>
                  <li>Camera malfunction</li>
                </ul>
                <p>
                  The image will be updated automatically as soon as we the
                  camera comes back online and we receive a new image.
                </p>
              </div>
            )}

            {!camera.is_on && (
              <div className="camera-message unavailable">
                <FontAwesomeIcon icon={faVideoSlash} />
                <p className="bold">
                  This camera image is currently unavailable due to technical
                  difficulties.
                </p>
                <p>This is sometimes due to:</p>
                <ul>
                  <li>Power disruptions to the camera</li>
                  <li>Vandalism</li>
                  <li>Signal transmission issues</li>
                </ul>
                <p>
                  Our technicians have been alerted and service will resume as
                  soon as possible. Repairs are subject to repair part
                  availability and staff availability to access the location.
                  Web camera function will return once repairs have been
                  completed.
                </p>
              </div>
            )}

            <div className="camera-update camera-update--desktop">
              <p className="next-update bold">
                Next update attempt: {nextUpdate}
              </p>
              <p>
                Camera image updates approximately every{' '}
                {Math.ceil(camera.update_period_mean / 60)} minutes.
              </p>
            </div>

            <div className="camera-imagery">
              <Tabs
                id="camera-details"
                activeKey={activeTab}
                onSelect={ (selectedTab) => setActiveTab(selectedTab) }>

                <Tab eventKey="webcam" title={!xLargeScreen &&
                  <span>
                    <CurrentCameraIcon variant="outline" /> Current camera
                  </span>
                }>
                  <div className="camera-update camera-update--mobile">
                    <p className="next-update bold">
                      Next update attempt: {nextUpdate}
                    </p>

                    <p>
                      Camera image updates approximately every{' '}
                      {Math.ceil(camera.update_period_mean / 60)} minutes.
                    </p>
                  </div>

                  <div className="actions-bar actions-bar--webcam">
                    <div className="camera-orientations">
                      <span className="camera-direction-label">
                        <img className="colocated-camera-icon" src={colocatedCamIcon} role="presentation" alt="colocated cameras icon" />
                        <span>Direction</span>
                      </span>
                      {camera.camGroup.map((cam) =>
                        <Button aria-label={getCameraOrientation(cam.orientation)} className={'camera-direction-btn' + ((camera.orientation == cam.orientation) ? ' current' : '') } key={cam.id} onClick={() => setCamera(cam)}>{cam.orientation}</Button>
                      )}
                    </div>

                    <div className="replay-div">
                      {shouldRenderReplay() &&
                        <FontAwesomeIcon icon={faClockRotateLeft} />
                      }

                      {shouldRenderReplay() &&
                        <Form className="replay-the-day">
                          <Form.Check
                            onChange={toggleReplay}
                            type="switch"
                            id="replay-toggle"
                            label="Replay the day"
                          />
                        </Form>
                      }
                    </div>
                  </div>
                  <div className="image-wrap">
                    {camera.is_on && (
                      <div className="card-img-box">
                        {!replay ?
                          <img src={camera.links.imageDisplay} alt={camera.name} /> :

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
                            onSlide={(index) => handleImageSlide(index)}
                            onPlay={play}
                            infinite={false} />
                        }
                      </div>
                    )}

                    {!camera.is_on && (
                      <div className="card-img-box unavailable">
                        <FontAwesomeIcon icon={faVideoSlash} />
                      </div>
                    )}

                    {!replay && (
                      <div className="timestamp">
                        <p className="driveBC">Drive<span>BC</span></p>
                        <FriendlyTime date={lastUpdate} includeFullIfHumanized />
                      </div>
                    )}
                  </div>
                  <p className="credit" dangerouslySetInnerHTML={{__html: camera.credit}}></p>
                </Tab>

                <Tab eventKey="nearby" title={!xLargeScreen &&
                  <span>
                    <FontAwesomeIcon icon={faFlag} />Nearby
                  </span>
                }>
                  <div className="actions-bar actions-bar--nearby"></div>
                  <div className="map-wrap map-context-wrap">
                    <DndProvider options={HTML5toTouch}>
                      <Map camera={camera} isCamDetail={true} mapViewRoute={mapViewRoute} loadCamDetails={loadCamDetails} />
                    </DndProvider>
                  </div>
                </Tab>
              </Tabs>
            </div>
          </div>
        )}
      </div>
      { (activeTab === 'webcam') &&
        <Footer replay={replay} />
      }
    </div>
  );
}
