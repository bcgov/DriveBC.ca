import React, { useEffect, useState, useRef } from "react";
import { getWebcams } from "../data/webcams";
import './CameraList.scss';
import Container from 'react-bootstrap/Container';
import WebcamCard from'./WebcamCard.js';
import InfiniteScroll from "react-infinite-scroll-component";

export default function CameraList() {
  const [webcams, setWebcams] = useState({});
  const [nextUrl, setNext] = useState('http://localhost:8000/api/webcams/?limit=50&offset=0');
  const [webcamLength, setWebcamLength] = useState(0);

  async function getCameras() {
    const { webcamNextUrl, webcamData } = await getWebcams(nextUrl);

    // Next URL and data length
    setNext(webcamNextUrl);
    setWebcamLength(webcamLength + webcamData.length);

    // Webcam data reduced to arrays grouped by highway
    webcamData.forEach((camera) => {
      const { highway } = camera.properties;
      if (!(highway in webcams)) {
        webcams[highway] = [];
      }

      webcams[highway].push(camera);
    });

    setWebcams(webcams);
  }

  useEffect(() => {
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
      <InfiniteScroll
        dataLength={webcamLength}
        next={getCameras}
        hasMore={nextUrl !== null}
        loader={<h4>Loading...</h4>}
      >
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
      </InfiniteScroll>
    </div>
  );
}
