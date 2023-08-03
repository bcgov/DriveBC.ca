// React
import React, { useEffect, useRef, useState } from "react";

// Third party packages
import Container from 'react-bootstrap/Container';
import InfiniteScroll from "react-infinite-scroll-component";

// Components and functions
import { getWebcams } from "../data/webcams";
import WebcamCard from'./WebcamCard.js';

// Static files
import BCHwyCrest1 from '../../images/BCHwyCrest1.svg';
import BCHwyCrest3 from '../../images/BCHwyCrest3.svg';
import BCHwyCrest5 from '../../images/BCHwyCrest5.svg';
import BCHwyCrest16 from '../../images/BCHwyCrest16.svg';
import BCHwyCrest from '../../images/BCHwyCrest.svg';

// Styling
import './CameraList.scss';

export default function CameraList() {
  // UseRef hooks
  const isInitialMount = useRef(true);

  // UseState hooks
  const [webcams, setWebcams] = useState([]);
  const [displayedWebcams, setDisplayedWebcams] = useState([]);

  // UseEffect hooks and data functions
  const getWebcamsData = async () => {
    const webcamResults = await getWebcams();
    setWebcams(webcamResults);

    isInitialMount.current = false;
  }

  const getDisplayedWebcams = () => {
    const res = webcams.slice(0, displayedWebcams.length + 7);
    setDisplayedWebcams(res);
  }

  useEffect(() => {
    getWebcamsData();

    return () =>{
      //unmounting, so empty list object
      setWebcams({});
    }
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) { // Only run on updates
      getDisplayedWebcams();
    }
  }, [webcams]);

  // Rendering
  const mapDisplayedWebcams = () => {
    // Webcam data reduced to arrays grouped by highway
    const res = {};
    displayedWebcams.forEach((cameraData) => {
      const { highway } = cameraData;
      if (!(highway in res)) {
        res[highway] = [];
      }

      res[highway].push(cameraData);
    });

    return res;
  }

  const renderWebcams = () => {
    return Object.entries(mapDisplayedWebcams()).map(([highway, cameras]) => (
      <div className="highway-group" key={highway}>
        <Container>
          <div className="highway-title">
            <div className="highway-shield-box">
              {highway === "1" &&
                <div className="highway-shield">
                  <img src={BCHwyCrest1} alt="1"/>
                </div>
              }
              {highway === "3" &&
                <div className="highway-shield">
                  <img src={BCHwyCrest3} alt="3"/>
                </div>
              }
              {highway === "5" &&
                <div className="highway-shield">
                  <img src={BCHwyCrest5} alt="5"/>
                </div>
              }
              {highway === "16" &&
                <div className="highway-shield">
                  <img src={BCHwyCrest16} alt="16"/>
                </div>
              }
              {highway !== "1" && highway !== "3" && highway !== "5" && highway !== "16" &&
                <div className="highway-shield">
                  <span className="highway-shield__number">{highway}</span>
                  <img src={BCHwyCrest} alt={highway}/>
                </div>
              }
            </div>

            <div className="highway-name">
              <p className="highway-name__number">Highway {highway}</p>
              {highway === "1" &&
                <h2 className="highway-name__alias highway-name__alias--green">Trans Canada</h2>
              }
              {highway !== "1" &&
                <h2 className="highway-name__alias">Highway {highway}</h2>
              }
            </div>
          </div>

          <div className="webcam-group">
            {cameras.map((camera, id) => (
              <WebcamCard camera={camera} className="webcam" key={id}>
              </WebcamCard>
            ))}
          </div>
        </Container>
      </div>
    ))
  }

  return (
    <div className="camera-list">
      <InfiniteScroll
        dataLength={displayedWebcams.length}
        next={getDisplayedWebcams}
        hasMore={displayedWebcams.length < webcams.length}
        loader={<h4>Loading...</h4>}>

        {renderWebcams()}
      </InfiniteScroll>
    </div>
  );
}
