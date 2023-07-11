import React, { useEffect, useState } from "react";
import { getWebcams } from "../data/webcams";
import './CameraList.scss';
import Container from 'react-bootstrap/Container';
import WebcamCard from'./WebcamCard.js';
import InfiniteScroll from "react-infinite-scroll-component";
import BCHwyCrest1 from '../../images/BCHwyCrest1.svg';
import BCHwyCrest3 from '../../images/BCHwyCrest3.svg';
import BCHwyCrest5 from '../../images/BCHwyCrest5.svg';
import BCHwyCrest16 from '../../images/BCHwyCrest16.svg';
import BCHwyCrest from '../../images/BCHwyCrest.svg';

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
      getCameras();

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
        ))}
      </InfiniteScroll>
    </div>
  );
}
