// React
import React, {useEffect, useRef, useState} from 'react';

// Third party packages
import Container from 'react-bootstrap/Container';
import InfiniteScroll from 'react-infinite-scroll-component';

// Components and functions
import { getWebcams, groupCameras } from '../data/webcams';
import WebcamCard from './WebcamCard.js';
import highwayShield from '../highwayShield.js';
import Advisories from '../advisories/Advisories';

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
    const cameras = groupCameras(webcamResults);

    setWebcams(cameras);

    isInitialMount.current = false;
  };

  const getDisplayedWebcams = () => {
    webcams.sort((a, b) => {
      return parseInt(a.highway, 10) - parseInt(b.highway, 10);
    });
    const res = webcams.slice(0, displayedWebcams.length + 7);
    setDisplayedWebcams(res);
  };

  useEffect(() => {
    getWebcamsData();

    return () =>{
      // unmounting, so empty list object
      setWebcams({});
    };
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) { // Only run on updates
      getDisplayedWebcams();
    }        
  }, [webcams]);

  useEffect(() => {
    const scrollPosition = sessionStorage.getItem('scrollPosition');
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition, 10));
    }
  });

  // Rendering
  const mapDisplayedWebcams = () => {
    // Webcam data reduced to arrays grouped by highway
    const res = {};
    displayedWebcams.forEach((cameraData) => {
      const {highway} = cameraData;
      if (!(highway in res)) {
        res[highway] = [];
      }

      res[highway].push(cameraData);
    });

    return res;
  };

  const renderWebcams = () => {
    return Object.entries(mapDisplayedWebcams()).map(([highway, cameras]) => (
      <div className="highway-group" key={highway}>
        <Container>
          <div className="highway-title">
            <div className="highway-shield-box">
              {highwayShield(highway)}
            </div>

            <div className="highway-name">
              <p className="highway-name__number">Highway {highway}</p>
              {highway === '1' &&
                <h2 className="highway-name__alias highway-name__alias--green">Trans Canada</h2>
              }
              {highway !== '1' &&
                <h2 className="highway-name__alias">Highway {highway}</h2>
              }
            </div>
          </div>

          <div className="webcam-group">
            {cameras.map((camera, id) => (
              <WebcamCard cameraData={camera} className="webcam" key={id}>
              </WebcamCard>
            ))}
          </div>
        </Container>
      </div>
    ));
  };

  return (
    <div className="camera-list">
      <InfiniteScroll
        dataLength={displayedWebcams.length}
        next={getDisplayedWebcams}
        hasMore={displayedWebcams.length < webcams.length}
        loader={<h4>Loading...</h4>}>

        <Container>
          <Advisories />
        </Container>

        {renderWebcams()}
      </InfiniteScroll>
    </div>
  );
}
