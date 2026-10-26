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
const CAMERA_LIST_RETURN_KEY = 'cameraListReturn';

const readCameraListReturn = () => {
  try {
    const raw = sessionStorage.getItem(CAMERA_LIST_RETURN_KEY);
    if (!raw) {
      return null;
    }

    const data = JSON.parse(raw);
    if (!data || !data.list) {
      return null;
    }

    return data;
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
  const returnApplied = useRef(false);
  // Scroll offset to apply once, after the saved window of cards is on screen.
  const pendingScrollTop = useRef(null);

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

      if (!returnApplied.current) {
        const returnInfo = readCameraListReturn();
        if (returnInfo && returnInfo.list === location.pathname) {
          const savedLength = Number(returnInfo.displayLength);
          if (Number.isFinite(savedLength) && savedLength > camsContext.displayLength) {
            camsContext.displayLength = Math.min(savedLength, cameras.length);
          }

          const savedTop = Number(returnInfo.scrollTop);
          pendingScrollTop.current = Number.isFinite(savedTop) ? savedTop : 0;
          returnApplied.current = true;
          try {
            sessionStorage.removeItem(CAMERA_LIST_RETURN_KEY);
          } catch {
            // The scroll restore still runs from the ref if storage cannot be cleared.
          }
        }
      }

      getDisplayedCameras(camsContext.displayLength);
    }
  }, [cameras, location.pathname]);

  useLayoutEffect(() => {
    if (pendingScrollTop.current == null || showLoader || !onscreenCameras.length) {
      return;
    }

    const main = document.getElementById('main');
    if (!main) {
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
