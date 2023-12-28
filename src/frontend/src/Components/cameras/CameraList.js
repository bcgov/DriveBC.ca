// React
import React, {useEffect, useState} from 'react';

// Third party packages
import Container from 'react-bootstrap/Container';
import InfiniteScroll from 'react-infinite-scroll-component';

// Components and functions
import { collator } from '../data/webcams';
import HighwayGroup from './HighwayGroup.js';
import Advisories from '../advisories/Advisories';

// Styling
import './CameraList.scss';

export default function CameraList(props) {
  // Props
  const { cameras } = props;

  // UseState hooks
  const [displayedCameras, setDisplayedCameras] = useState([]);

  // UseEffect hooks and data functions
  const getDisplayedCameras = (length) => {
    const res = cameras.slice(0, length ? length : displayedCameras.length + 7);
    setDisplayedCameras(res);
  };

  useEffect(() => {
    getDisplayedCameras(displayedCameras.length);
  }, [cameras]);

  // Rendering
  const mapDisplayedCameras = () => {
    // Webcam data reduced to arrays grouped by highway
    const res = {};
    displayedCameras.forEach((cam) => {
      const {highway} = cam;
      if (!(highway in res)) {
        res[highway] = [];
      }

      res[highway].push(cam);
    });

    return res;
  };

  const renderHighways = () => {
    const mappedCams = mapDisplayedCameras();
    const highwayKeys = Object.keys(mappedCams);

    // Render camera groups by highway number
    highwayKeys.sort(collator.compare);

    return highwayKeys.map((highway) => <HighwayGroup key={highway} highway={highway} cams={mappedCams[highway]} />);
  }

  return (
    <div className="camera-list">
      <InfiniteScroll
        dataLength={displayedCameras.length}
        next={getDisplayedCameras}
        hasMore={displayedCameras.length < cameras.length}
        loader={<h4>Loading...</h4>}>

        <Container>
          <Advisories />
        </Container>

        {renderHighways()}
      </InfiniteScroll>
    </div>
  );
}
