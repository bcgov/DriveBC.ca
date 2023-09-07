// React
import React, {useEffect, useRef, useState} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';

// Third party packages
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRotateRight,
  faExclamationTriangle,
  faVideoSlash,
  faPlay,
  faPause,
  faBackward,
  faForward,
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
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

// Components and functions
import { getWebcams } from '../Components/data/webcams.js';
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

  const navigate = useNavigate();

  const cameraTab = <CurrentCameraIcon variant="outline" />;
  const nearby = <FontAwesomeIcon icon={faFlag} />;

  async function initCamera() {
    const camera = await getWebcams(`//${process.env.REACT_APP_API_HOST}/api/webcams/${params.id}`);
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
      return {original: `//${process.env.REACT_APP_REPLAY_THE_DAY}${camera.id}/${url}.jpg`};
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
    navigate("/", { state: JSON.stringify(camera)})
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

  // Rendering
  return (
    <div className="camera-page">
      <div className="page-header">
        <Container>
          <Link to="/cameras-page" className="back-link">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to camera list
          </Link>
        </Container>
      </div>
      <div>
        {camera && (
          <div className="container--full-width">
            <div className="camera-details">
              <div className="camera-details__description">
                <h2>{camera.name}</h2>
                <p className="body--large">{camera.caption}</p>
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

            <div className="camera-update">
              <p className="bold">
                This camera updates its image approximately every{' '}
                {Math.ceil(camera.update_period_mean / 60)} minutes
              </p>
            </div>

            <div className="camera-imagery">
              <Tabs
                id="camera-details"
                activeKey={activeTab}
                onSelect={ (selectedTab) => setActiveTab(selectedTab) }
              >
                <Tab eventKey="webcam" title={<span>{cameraTab} Current camera</span>}>
                  <div className="replay-div">
                    <div className="next-update">
                      <FontAwesomeIcon icon={faArrowRotateRight} />
                      <p>
                        Next update attempt: {nextUpdate}
                      </p>
                    </div>

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
                          renderRightNav={customRightNav} />
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
                        <p className="label"><FriendlyTime date={lastUpdate} /></p>
                      </div>
                    )}
                  </div>
                </Tab>
                <Tab eventKey="nearby" title={<span>{nearby}Nearby</span>}>
                  <div className="replay-div"></div>
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
