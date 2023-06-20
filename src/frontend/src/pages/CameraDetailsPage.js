import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { getWebcam } from "../Components/data/webcams";
import "../Components/cameras/CameraList.scss";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import WebcamCard from "../Components/cameras/WebcamCard.js";
import PageHeader from "../PageHeader";

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
  return (
    <div className="camera-page">
      <PageHeader title="Camera Details" description=""></PageHeader>
      <div>
      <Link to="/CamerasPage">Back to web camera list</Link>
        {camera && (
          <Container>
            <Card className="webcam-card">
              <Card.Body>
                <p className="label bold">{camera.name}</p>
                <p className="label bold">{camera.caption}</p>
                <p className="label">Highway {camera.highway}</p>
                <p className="label">Elevation: {camera.Elevation}</p>
                <div className="card-img-box">
                    {replay ? <Card.Img variant="top" src={camera.links.currentImage} /> :  <Card.Img variant="top" src={camera.links.replayTheDay} />}
                </div>
                <p className="label">
                  This camera updates its image approximately every{" "}
                  {camera.update_period_mean / 60} minutes
                </p>
                <button onClick={toggleReplay}>Replay the day</button>
              </Card.Body>
            </Card>
          </Container>
        )}
      </div>
    </div>
  );
}
