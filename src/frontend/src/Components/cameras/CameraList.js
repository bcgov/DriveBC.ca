import React, { useEffect, useState, useRef } from "react";
import { getWebcams } from "../data/webcams";
import './CameraList.scss';
import Container from 'react-bootstrap/Container';
import WebcamCard from'./WebcamCard.js';

export default function CameraList() {
  const [webcams, setWebcams] = useState({});
  const groupedCameras = {};

  useEffect(() => {

    async function getCameras() {
      const retrievedCameras = await getWebcams();
      retrievedCameras.forEach((camera) => {
        const highway = camera.properties.highway;
        if (groupedCameras[highway]) {
          groupedCameras[highway].push(camera);
        } else {
          groupedCameras[highway] = [camera];
        }
      });

      setWebcams(groupedCameras);
    }
    if (!webcams.length) {
      getCameras();
    }
    return () =>{
      //unmounting, so empty list object
      setWebcams({});
    }
  }, []);
  return (
    <div className="camera-list">
      {Object.entries(webcams).map(([highway, cameras]) => (
        <div className="highway-group" key={highway}>
          <Container>
            <h2 className="highway-name">Highway {highway}</h2>
            <div className="webcam-group">
              {cameras.map((camera, id) => (
                <WebcamCard camera={camera} className="webcam" key={id}>
                </WebcamCard>
              ))}
            </div>
          </Container>
        </div>
      ))}
    </div>
  );
}
