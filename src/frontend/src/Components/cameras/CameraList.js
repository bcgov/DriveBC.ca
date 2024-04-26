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
  const { cameras, selectedRoute } = props;

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
  const groupDisplayedCameras = () => {
    // Group adjacent cams on the same road into  arrays
    const res = [];
    displayedCameras.forEach((cam) => {
      const highway = cam.highway_display;

      if (res.length == 0 || res[res.length-1]['highway'] !== highway) {
        res.push({
          'highway': highway,
          'cams': []
        })
      }

      res[res.length-1]['cams'].push(cam);
    });

    return res;
  };

  const renderHighways = () => {
    const groupedCams = groupDisplayedCameras();

    const res = [];
    for (const {highway, cams} of groupedCams) {
      res.push(<HighwayGroup key={highway} highway={highway} cams={cams} />);
    }

    return res;
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
