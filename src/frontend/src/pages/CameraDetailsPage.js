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
import Footer from '../Footer.js';
import '../CameraDetailsPage.scss';

export default function CameraDetailsPage() {
  const [camera, setCamera] = useState(null);
  const [replay, setReplay] = useState(true);
  const { state } = useLocation();

  useEffect(() => {
    async function getCamera(state) {
      const retrievedCamera = await getWebcam(state);
      setCamera(retrievedCamera);
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
                <p className=".body--large">{camera.caption}</p>
              </div>
              <div className="camera-details__more">
                <div className="camera-details__more__hwy">
                <img className="hwy" src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/BC-1_%28TCH%29.svg/150px-BC-1_%28TCH%29.svg.png" />
                  <p className="label--more">Trans Canada</p>
                </div>
                <div className="camera-details__more__elevation">
                  <p className="elevation"><span className="number">{camera.elevation}</span>m</p>
                  <p className="label--more">Elevation</p>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <p className="bold">
              This camera updates its image approximately every {round(camera.update_period_mean / 60)} minutes
            </p>

            <div className="camera-imagery">
              <Tabs>
                <Tab eventKey="webcam" title="Current web camera">
                  <div className="replay-div">
                    <div className="next-update">
                      <p><FontAwesomeIcon icon={faArrowRotateRight} />Next update: TBD</p>
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
                  <div className="card-img-box">
                    {replay ? <img src={camera.links.imageSource} /> :  <img src={camera.links.replayTheDay} />}
                  </div>
                </Tab>
                <Tab eventKey="nearby" title="Nearby">
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
