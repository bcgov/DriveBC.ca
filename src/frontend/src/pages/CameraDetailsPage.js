// React
import React, {useEffect, useRef, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Third party packages
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faExclamationTriangle,
  faVideoSlash,
  faPlay,
  faPause,
  faBackward,
  faForward,
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import {
  faFlag
} from '@fortawesome/free-regular-svg-icons';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Button from 'react-bootstrap/Button';
import ImageGallery from 'react-image-gallery';
import parse from 'html-react-parser';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

// Components and functions
import { getCameraGroupMap, getWebcams } from '../Components/data/webcams.js';
import {DndProvider} from 'react-dnd-multi-backend';
import {getWebcamReplay} from '../Components/data/webcams';
import {HTML5toTouch} from 'rdndmb-html5-to-touch';
import Map from '../Components/Map.js';
import Footer from '../Footer.js';
import FriendlyTime from '../Components/FriendlyTime';
import highwayShield from '../Components/highwayShield';
import CurrentCameraIcon from '../Components/CurrentCameraIcon';

// Styling
import './CameraDetailsPage.scss';
import '../Components/Map.scss';

import colocatedCamIcon from '../images/colocated-camera.svg';

export default function CameraDetailsPage() {
  // Context and router data
  const params = useParams();

  // State hooks
  const [camera, setCamera] = useState(null);
  const [replay, setReplay] = useState(true);
  const [replayImages, setReplayImages] = useState([]);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('webcam');
  const [hasImageEnded, setHasImageEnded] = useState(false);

  const navigate = useNavigate();

  const cameraTab = <CurrentCameraIcon variant="outline" />;
  const nearby = <FontAwesomeIcon icon={faFlag} />;

  async function initCamera() {
    const allCameras = await getWebcams();
    const cameraGroupMap = getCameraGroupMap(allCameras);

    const camera = await getWebcams(null, `${window.API_HOST}/api/webcams/${params.id}/`);

    // Group cameras
    const group = cameraGroupMap[camera.group];
    camera.camGroup = group;
    camera.camGroup.forEach((cam) => cam.camGroup = group);

    // Camera data
    setCamera(camera);

    // Next update time
    const currentTime = new Date();
    const nextUpdateTime = currentTime.setSeconds(currentTime.getSeconds() + camera.update_period_mean);
    const nextUpdateTimeFormatted = new Intl.DateTimeFormat('en-US',
        {hour: 'numeric',
          minute: 'numeric',
          timeZoneName: 'short'},
    ).format(nextUpdateTime);
    setNextUpdate(nextUpdateTimeFormatted);

    // Last update time
    setLastUpdate(camera.last_update_modified);

    // Replay images
    const replayImageList = await getWebcamReplay(camera);
    const replayImages = replayImageList.map((url) => {
      return {original: `${window.REPLAY_THE_DAY}${camera.id}/${url}.jpg`};
    });
    setReplayImages(replayImages);
  }

  useEffect(() => {
    initCamera();

    return () => {
      // unmounting, so revert camera to null
      setCamera(null);
    };
  }, []);

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
        <Button className="replay-btn replay-backward" onClick={onClick} disabled={disabled} >
          <FontAwesomeIcon icon={faBackward} />
        </Button>
      </div>
    );
  };

  const customPlayPause = (onClick, isPlaying) => {
    return (
      <div className="replay-control replay-control--play">
        <Button className="replay-btn replay-play" onClick={onClick} isPlaying={isPlaying} >
          {isPlaying ? <FontAwesomeIcon icon={faPause} /> : <FontAwesomeIcon icon={faPlay} />}
        </Button>
      </div>
    );
  };

  const customRightNav = (onClick, disabled) => {
    return (
      <div className="replay-control replay-control--forward">
        <Button className="replay-btn replay-forward" onClick={onClick} disabled={disabled} >
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

  // Rendering
  return (
    <div className="camera-page">
      <div className="page-header">
        <Container>
          <a onClick={returnHandler} className="back-link">
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
                <div className="camera-details__more__hwy">
                  {highwayShield(camera.highway)}
                  <p className="label--more">Highway {camera.highway}</p>
                </div>
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
                onSelect={ (selectedTab) => setActiveTab(selectedTab) }
              >
                <Tab eventKey="webcam" title={<span>{cameraTab} Current camera</span>}>

                  <div className="camera-update camera-update--mobile">
                    <p className="next-update bold">
                      Next update attempt: {nextUpdate}
                    </p>
                    <p>
                      Camera image updates approximately every{' '}
                      {Math.ceil(camera.update_period_mean / 60)} minutes.
                    </p>
                  </div>

                  <div className="camera-functions">
                    <div className="camera-orientations">
                      <span className="camera-direction-label">
                        <img className="colocated-camera-icon" src={colocatedCamIcon} role="presentation" alt="colocated cameras icon" />
                        <span>Direction</span>
                      </span>
                      <span className="camera-directions-group">
                        {camera.camGroup.map((cam) =>
                          <Button className={'camera-direction-btn' + ((camera.orientation == cam.orientation) ? ' current' : '') } key={cam.id} onClick={() => setCamera(cam)}>{cam.orientation}</Button>
                        )}
                      </span>
                    </div>

                    <div className="replay-div">
                      <FontAwesomeIcon icon={faClockRotateLeft} />
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
                        {replay ? (
                        <img src={camera.links.imageSource} alt="camera"/>
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
                          onSlide={(index) => handleImageSlide(index)}
                          onPlay={play}
                          infinite={false} />
                      )}
                      </div>
                    )}

                    {!camera.is_on && (
                      <div className="card-img-box unavailable">
                        <FontAwesomeIcon icon={faVideoSlash} />
                      </div>
                    )}

                    {replay && (
                      <div className="timestamp">
                        <p className="driveBC">Drive<span>BC</span></p>
                        <FriendlyTime date={lastUpdate} />
                      </div>
                    )}
                  </div>
                </Tab>
                <Tab eventKey="nearby" title={<span>{nearby}Nearby</span>}>
                  <div className="map-wrap map-context-wrap">
                    <DndProvider options={HTML5toTouch}>
                      <Map camera={camera} isPreview={true} cameraHandler={initCamera} mapViewRoute={mapViewRoute}/>
                    </DndProvider>
                  </div>
                </Tab>
              </Tabs>
            </div>
          </div>
        )}
      </div>
      { (activeTab === 'webcam') &&
        <Footer />
      }
    </div>
  );
}
