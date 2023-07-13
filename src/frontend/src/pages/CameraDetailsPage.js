// React
import React, { useContext, useEffect, useState } from "react";

// Third party packages
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { faArrowRotateRight } from "@fortawesome/free-solid-svg-icons";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { faMagnifyingGlassLocation } from "@fortawesome/free-solid-svg-icons";
import { faVideo } from "@fortawesome/free-solid-svg-icons";
import { faVideoSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation, Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

// Components and functions
import { getWebcam } from "../Components/data/webcams";
import { MapContext } from "../App.js";
import { DndProvider } from "react-dnd-multi-backend";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import Map from "../Components/Map.js";
import Footer from "../Footer.js";

// Static files
import BCHwyCrest from "../images/BCHwyCrest.svg";
import BCHwyCrest1 from "../images/BCHwyCrest1.svg";
import BCHwyCrest3 from "../images/BCHwyCrest3.svg";
import BCHwyCrest5 from "../images/BCHwyCrest5.svg";
import BCHwyCrest16 from "../images/BCHwyCrest16.svg";

// Styling
import "../CameraDetailsPage.scss";
import "../Components/Map.scss"

export default function CameraDetailsPage() {
  const [camera, setCamera] = useState(null);
  const [replay, setReplay] = useState(true);
  const [nextUpdate, setNextUpdate] = useState(null);

  const { mapContext, setMapContext } = useContext(MapContext);

  const { state } = useLocation();

  const datetime_format = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };

  const cameraTab = <FontAwesomeIcon icon={faVideo} />;
  const nearby = <FontAwesomeIcon icon={faMagnifyingGlassLocation} />;

  function initCamera(camera) {
    setCamera(camera);
    const next_update_time = addSeconds(
      new Date(camera.last_update_modified),
      camera.update_period_mean
    );
    const next_update_time_formatted = new Intl.DateTimeFormat(
      "en-US",
      datetime_format
    ).format(next_update_time);
    setNextUpdate(next_update_time_formatted);
  }

  async function getCamera(state) {
    const retrievedCamera = await getWebcam(state);
    initCamera(retrievedCamera);
  }

  useEffect(() => {
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
          <Link to="/CamerasPage" className="back-link">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to web camera list
          </Link>
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
                {camera.highway === "1" && (
                  <div className="camera-details__more__hwy">
                    <div className="highway-shield">
                      <img src={BCHwyCrest1} alt="1" />
                    </div>
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                )}

                {camera.highway === "3" && (
                  <div className="camera-details__more__hwy">
                    <div className="highway-shield">
                      <img src={BCHwyCrest3} alt="3"/>
                    </div>
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                )}

                {camera.highway === "5" && (
                  <div className="camera-details__more__hwy">
                    <div className="highway-shield">
                      <img src={BCHwyCrest5} alt="5"/>
                    </div>
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                )}

                {camera.highway === "16" && (
                  <div className="camera-details__more__hwy">
                    <div className="highway-shield">
                      <img src={BCHwyCrest16} alt="16"/>
                    </div>
                    <p className="label--more">Highway {camera.highway}</p>
                  </div>
                )}

                {camera.highway !== "1" &&
                  camera.highway !== "3" &&
                  camera.highway !== "5" &&
                  camera.highway !== "16" && (
                    <div className="camera-details__more__hwy">
                      <div className="highway-shield">
                        <span className="highway-shield__number">
                          {camera.highway}
                        </span>
                        <img src={BCHwyCrest} alt={camera.highway}/>
                      </div>
                      <p className="label--more">Highway {camera.highway}</p>
                    </div>
                  )}
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
                  Unable to retrieve the latest image, we're displaying last
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

            <p className="camera-update bold">
              This camera updates its image approximately every{" "}
              {round(camera.update_period_mean / 60)} minutes
            </p>

            <div className="camera-imagery">
              <Tabs>
                <Tab
                  eventKey="webcam"
                  title={<span>{cameraTab} Current web camera</span>}
                >
                  <div className="replay-div">
                    <div className="next-update">
                      <p>
                        <FontAwesomeIcon icon={faArrowRotateRight} />
                        Next update attempt: {nextUpdate}
                      </p>
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
                  {camera.is_on && (
                    <div className="card-img-box">
                      {replay ? (
                        <img src={camera.links.imageSource} alt="camera"/>
                      ) : (
                        <img src={camera.links.replayTheDay} alt="replay" />
                      )}
                    </div>
                  )}

                  {!camera.is_on && (
                    <div className="card-img-box unavailable">
                      <FontAwesomeIcon icon={faVideoSlash} />
                    </div>
                  )}
                </Tab>
                <Tab eventKey="nearby" title={<span>{nearby}Nearby</span>}>
                  <div className="replay-div"></div>
                  <div className="map-context-wrap">
                    <DndProvider options={HTML5toTouch}>
                      <Map startLocation={camera.location.coordinates} isPreview={true} cameraHandler={initCamera}/>
                    </DndProvider>
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
