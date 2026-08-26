// React
import React, { useContext, useEffect, useRef } from 'react';

// Third party packages
import InfiniteScroll from 'react-infinite-scroll-component';

// Components and functions
import { CamsContext } from '../../App';
import HighwayGroup from './HighwayGroup';

// Styling
import './CameraList.scss';

const INITIAL_DISPLAY_LENGTH = 21;

export default function CameraList(props) {
  // Props
  const { cameras, onscreenCameras, setOnscreenCameras, showLoader } = props;

  // Contexts
  const { camsContext } = useContext(CamsContext);
  const prevCamerasLength = useRef(cameras?.length);

  // UseEffect hooks and data functions
  const getDisplayedCameras = (length) => {
    if (!length) { camsContext.displayLength += 4; }
    const shown = cameras.slice(0, length ? length : camsContext.displayLength);
    setOnscreenCameras(shown);
  };

  useEffect(() => {
    if (cameras && cameras.length > 0) {
      // Result set size changed (filter/search/route) — reset the infinite-scroll
      // window so a prior scroll depth does not dump hundreds of cards at once.
      if (prevCamerasLength.current !== cameras.length) {
        camsContext.displayLength = INITIAL_DISPLAY_LENGTH;
        prevCamerasLength.current = cameras.length;
      }
      getDisplayedCameras(camsContext.displayLength);
    }
  }, [cameras]);

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

  const getCameraList = () => {
    return cameras && cameras.length > 0 && (
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
  };

  const getLoader = () => {
    return (
      <div className="camera-list">
        <HighwayGroup key={`loading`} highway={'loading'} cams={[null, null, null]} showLoader={showLoader}/>
      </div>
    );
  };

  return showLoader ? getLoader() : getCameraList();
}
