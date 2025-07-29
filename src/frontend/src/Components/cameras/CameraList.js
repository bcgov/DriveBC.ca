// React
import React, { useContext, useEffect } from 'react';
// Third party packages
import InfiniteScroll from 'react-infinite-scroll-component';

// Components and functions
import { CamsContext, FilterContext } from '../../App.js';
import HighwayGroup from './HighwayGroup.js';

// Styling
import './CameraList.scss';

export default function CameraList(props) {
  // Props
  const { cameras, onscreenCameras, setOnscreenCameras, showLoader, enableExtraFilters } = props;

  // Contexts
  const { camsContext } = useContext(CamsContext);
  const { filterContext } = useContext(FilterContext);

  // UseEffect hooks and data functions
  const getDisplayedCameras = (length) => {
    // check for currently selected Highway from highway filter and process
    let filteredCameras = cameras;
    if (enableExtraFilters) {
      if (filterContext.highwayFilterKey) {
        filteredCameras = cameras.filter((camera) => (camera.highway_display === filterContext.highwayFilterKey));
      }

      if (filterContext.areaFilter) {
        filteredCameras = filteredCameras.filter((camera) => (camera.area === filterContext.areaFilter.id));
      }
    }

    if (!length) { camsContext.displayLength += 4; }
    const shown = filteredCameras.slice(0, length ? length : camsContext.displayLength);
    setOnscreenCameras(shown);
  };

  useEffect(() => {
    if (cameras) { // Do nothing until cameras are processed
      getDisplayedCameras(camsContext.displayLength);
    }
  }, [cameras, filterContext.highwayFilterKey, filterContext.areaFilter]);

  // Rendering
  const groupDisplayedCameras = () => {
    // Group adjacent cams on the same road into  arrays
    const groups = [];
    onscreenCameras.forEach((cam) => {
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

    for (const [index, { highway, cams }] of groupedCams.entries()) {
      groups.push(<HighwayGroup key={`${highway}-${index}`} highway={highway} cams={cams} showLoader={showLoader}/>);
    }

    return groups;
  }

  const getHasMore = () => {
    return onscreenCameras.length < (cameras ? cameras.length : 0);
  }

  return (
    <div className="camera-list">
      <InfiniteScroll
        dataLength={camsContext.displayLength}
        next={getDisplayedCameras}
        hasMore={getHasMore}
        scrollableTarget="main">

        {renderHighways()}
      </InfiniteScroll>
    </div>
  );
}
