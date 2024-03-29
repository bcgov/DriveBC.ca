// React
import React, { useEffect, useState } from 'react';

// Third party packages
import InfiniteScroll from 'react-infinite-scroll-component';

// Components and functions
import { collator } from '../data/webcams';
import HighwayGroup from './HighwayGroup.js';

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
    if (cameras) { // Do nothing until cameras are processed
      getDisplayedCameras(21); // Load up to 21 cameras at the start
    }
  }, [cameras]);

  // Rendering
  const mapDisplayedCameras = () => {
    // Webcam data reduced to arrays grouped by highway
    const res = {};
    displayedCameras.forEach((cam) => {
      // Use highway description if highway doesn't exist
      const highway = cam.highway != '9999' ? cam.highway : cam.highway_description;
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

  const getHasMore = () => {
    return displayedCameras.length < (cameras ? cameras.length : 0);
  }

  return (
    <div className="camera-list">
      <InfiniteScroll
        dataLength={displayedCameras.length}
        next={getDisplayedCameras}
        hasMore={getHasMore}>

        {renderHighways()}
      </InfiniteScroll>
    </div>
  );
}
