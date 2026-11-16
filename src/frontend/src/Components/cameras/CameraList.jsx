// React
import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Third party packages
import InfiniteScroll from 'react-infinite-scroll-component';

// Components and functions
import { CamsContext } from '../../App';
import HighwayGroup from './HighwayGroup';

// Styling
import './CameraList.scss';

const INITIAL_DISPLAY_LENGTH = 21;
const RETURN_KEY = 'cameraListReturn';

// Returns the scroll position and card count saved by CameraCard for this list (then clears it),
// so going back from a camera lands where the user left off.
const takeSavedReturn = (pathname) => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(RETURN_KEY));
    if (saved?.list !== pathname) {
      return null;
    }

    sessionStorage.removeItem(RETURN_KEY);
    return saved;
  } catch {
    return null;
  }
};

export default function CameraList(props) {
  // Props
  const { cameras, onscreenCameras, setOnscreenCameras, showLoader } = props;

  // Contexts
  const { camsContext } = useContext(CamsContext);
  const location = useLocation();
  const prevCamerasLength = useRef(cameras?.length);
  const pendingScrollTop = useRef(null);

  // UseEffect hooks and data functions
  const getDisplayedCameras = (length) => {
    if (!length) { camsContext.displayLength += 4; }
    const shown = cameras.slice(0, length ? length : camsContext.displayLength);
    setOnscreenCameras(shown);
  };

  useEffect(() => {
    if (!cameras || cameras.length === 0) {
      return;
    }

    // Result set changed (filter/search/route): start back at the first page of cards
    if (prevCamerasLength.current !== cameras.length) {
      camsContext.displayLength = INITIAL_DISPLAY_LENGTH;
      prevCamerasLength.current = cameras.length;
    }

    // Coming back from a camera: reload as many cards as before and queue the old scroll position
    const saved = takeSavedReturn(location.pathname);
    if (saved) {
      camsContext.displayLength = Math.min(
        Math.max(Number(saved.displayLength) || 0, camsContext.displayLength),
        cameras.length,
      );
      pendingScrollTop.current = Number(saved.scrollTop) || 0;
    }

    getDisplayedCameras(camsContext.displayLength);
  }, [cameras, location.pathname]);

  // Apply the queued scroll once those cards are rendered, before paint to avoid a jump
  useLayoutEffect(() => {
    const main = document.getElementById('main');
    if (pendingScrollTop.current == null || showLoader || !onscreenCameras.length || !main) {
      return;
    }

    main.scrollTop = pendingScrollTop.current;
    pendingScrollTop.current = null;
  }, [onscreenCameras, showLoader]);

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
          scrollableTarget="main"
          style={{ overflow: 'visible' }}>

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
