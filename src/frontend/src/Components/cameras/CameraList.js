// React
import React, { useContext, useEffect, useState } from 'react';
// Third party packages
import InfiniteScroll from 'react-infinite-scroll-component';

// Components and functions
import { CamsContext } from '../../App.js';
import HighwayGroup from './HighwayGroup.js';

// Styling
import './CameraList.scss';

export default function CameraList(props) {
  // Props
  const { cameras, showLoader, enableHighwayFilter } = props;

  // Contexts
  const { camsContext } = useContext(CamsContext);

  // UseState hooks
  const [displayedCameras, setDisplayedCameras] = useState([]);

  // UseEffect hooks and data functions
  const getDisplayedCameras = (length) => {
    // check for currently selected Highway from highway filter and process
    let filteredCameras = cameras;
    if (enableHighwayFilter && camsContext.highwayFilterKey) {
      filteredCameras = cameras.filter((camera) => (camera.highway_display === camsContext.highwayFilterKey));
    }

    if (!length) { camsContext.displayLength += 4; }
    const shown = filteredCameras.slice(0, length ? length : camsContext.displayLength);
    setDisplayedCameras(shown);
  };

  useEffect(() => {
    if (cameras) { // Do nothing until cameras are processed
      getDisplayedCameras(camsContext.displayLength);
    }
  }, [cameras, camsContext.highwayFilterKey]);

  // Rendering
  const groupDisplayedCameras = () => {
    // Group adjacent cams on the same road into  arrays
    const groups = [];
    displayedCameras.forEach((cam) => {
      const highway = cam.highway_display;
      if (groups.length == 0 || groups[groups.length - 1]['highway'] !== highway) {
        groups.push({
          'highway': highway,
          'cams': []
        });
      }

      groups[groups.length - 1]['cams'].push(cam);
    });

    return groups;
  };

  const renderHighways = () => {
    const groupedCams = groupDisplayedCameras();
    const groups = [];

    for (const {highway, cams} of groupedCams) {
      groups.push(<HighwayGroup key={highway} highway={highway} cams={cams} showLoader={showLoader}/>);
    }

    return groups;
  }

  const getHasMore = () => {
    return displayedCameras.length < (cameras ? cameras.length : 0);
  }

  return (
    <div className="camera-list">
      <InfiniteScroll
        dataLength={camsContext.displayLength}
        next={getDisplayedCameras}
        hasMore={getHasMore}>

        {renderHighways()}
      </InfiniteScroll>
    </div>
  );
}
