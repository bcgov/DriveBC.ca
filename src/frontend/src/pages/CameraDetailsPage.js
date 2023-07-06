import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getWebcam } from '../Components/data/webcams';
import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { faVideo } from '@fortawesome/free-solid-svg-icons';
import { faMagnifyingGlassLocation } from '@fortawesome/free-solid-svg-icons';
import Footer from '../Footer.js';
import '../CameraDetailsPage.scss';
import BCHwyCrest1 from '../images/BCHwyCrest1.svg';
import BCHwyCrest3 from '../images/BCHwyCrest3.svg';
import BCHwyCrest5 from '../images/BCHwyCrest5.svg';
import BCHwyCrest16 from '../images/BCHwyCrest16.svg';
import BCHwyCrest from '../images/BCHwyCrest.svg';

export default function CameraDetailsPage() {
  const [camera, setCamera] = useState(null);
  const [replay, setReplay] = useState(true);
  const [nextUpdate, setNextUpdate] = useState(null);

  const { state } = useLocation();

  const datetime_format = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  
  const cameraTab = <FontAwesomeIcon icon={faVideo} />
  const nearby = <FontAwesomeIcon icon={faMagnifyingGlassLocation} />
  
  useEffect(() => {
    async function getCamera(state) {
      const retrievedCamera = await getWebcam(state);
      setCamera(retrievedCamera);

      const next_update_time = addSeconds(new Date(retrievedCamera.last_update_modified), retrievedCamera.update_period_mean);
      const next_update_time_formatted = new Intl.DateTimeFormat("en-US", datetime_format).format(next_update_time);
      setNextUpdate(next_update_time_formatted);
    }

    if (!camera) {
      getCamera(state);
    }

    return () => {
      //unmounting, so revert camera to null
      setCamera(null);
    };
  }, []);

  const toggleReplay = () => {
    setReplay(!replay);
  };

  function addSeconds(date, seconds) {
    date.setSeconds(date.getSeconds() + seconds);

    return date;
  }

  function round(number) {
    return Math.ceil(number);
  }

  return (
    <div className="camera-page">
      <div className="page-header">
        <Container>
          <Link to="/CamerasPage" className="back-link"><FontAwesomeIcon icon={faArrowLeft} />Back to web camera list</Link>
        </Container>
      </div>
      <div>
        {camera && (
          <Container>
            <div className="camera-details">
              <div className="camera-details__description">
                <h2>{camera.name}</h2>
                <p className="body--large">{camera.caption}</p>
              </div>
              <div className="camera-details__more">

                {camera.highway == "1" &&
                  <div className="camera-details__more__hwy">
                    <div className="highway-shield">
                      <img src={BCHwyCrest1} />
                    </div>
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                }

                {camera.highway == "3" &&
                  <div className="camera-details__more__hwy">
                    <div className="highway-shield">
                      <img src={BCHwyCrest3} />
                    </div>
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                }

                {camera.highway == "5" &&
                  <div className="camera-details__more__hwy">
                    <div className="highway-shield">
                      <img src={BCHwyCrest5} />
                    </div>
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                }

                {camera.highway == "16" &&
                  <div className="camera-details__more__hwy">
                   <div className="highway-shield">
                      <img src={BCHwyCrest16} />
                    </div>
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                }

                {camera.highway != "1" && camera.highway != "3" && camera.highway != "5" && camera.highway != "16" &&
                  <div className="camera-details__more__hwy">
                    <div className="highway-shield">
                      <span className="highway-shield__number">{camera.highway}</span>
                      <img src={BCHwyCrest} />
                    </div>
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                }
                <div className="camera-details__more__elevation">
                  <p className="elevation"><span className="number">{camera.elevation}</span>m</p>
                  <p className="label--more">Elevation</p>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <p className="camera-update bold">
              This camera updates its image approximately every {round(camera.update_period_mean / 60)} minutes
            </p>

            <div className="camera-imagery">
              <Tabs>
                <Tab eventKey="webcam" title={<span>{cameraTab} Current web camera</span>} >
                  <div className="replay-div">
                    <div className="next-update">
                      <p><FontAwesomeIcon icon={faArrowRotateRight} />Next update attempt: {nextUpdate}</p>
                    </div>
                    <Form className="replay-the-day">
                      <Form.Check
                        onChange={toggleReplay}
                        type="switch"
                        id="replay-toggle"
                        label="Replay the day"
                      />
                    </Form>
                  </div>
                  {camera.is_on && !camera.marked_stale && !camera.marked_delayed &&
                    <div className="card-img-box">
                      {replay ? <img src={camera.links.imageSource} /> :  <img src={camera.links.replayTheDay} />}
                    </div>
                  }

                  {camera.is_on && camera.marked_stale && !camera.marked_delayed &&
                    <div className="card-img-box">
                      {replay ? <img src={camera.links.imageSource} /> :  <img src={camera.links.replayTheDay} />}
                      <p>Unable to retrieve the latest image, we're displaying last image received</p>
                    </div>
                  }

                  {camera.is_on && camera.marked_delayed &&
                    <div className="card-img-box">
                      {replay ? <img src={camera.links.imageSource} /> :  <img src={camera.links.replayTheDay} />}
                      <p>Experiencing longer than expected delay, displaying last image received</p>
                    </div>
                  }
                  
                  
                  {!camera.is_on &&
                    <div className="card-img-box">
                      <p>Unable to communicate with web camera, image is unavailable</p>
                    </div>
                  }
                </Tab>
                <Tab eventKey="nearby" title={<span>{nearby}Nearby</span>}>
                  <div className="replay-div">
                  </div>
                  <div className="card-img-box">
                    <img src="https://placehold.co/900x900" />
                  </div>
                </Tab>
              </Tabs>
            </div>
          </Container>
        )}
      </div>
      <Footer />
    </div>
  );
}
