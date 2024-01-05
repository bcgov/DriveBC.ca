// React
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'

// Components and functions
import { collator, getCameras, addCameraGroups } from '../Components/data/webcams';
import { updateCameras } from '../slices/camerasSlice';
import CameraList from '../Components/cameras/CameraList';
import PageHeader from '../PageHeader';
import Footer from '../Footer.js';

export default function CamerasListPage() {
  // Redux
  const dispatch = useDispatch();
  const { cameras, camTimeStamp, selectedRoute } = useSelector(useCallback(memoize(state => ({
    cameras: state.cameras.list,
    camTimeStamp: state.cameras.routeTimeStamp,
    selectedRoute: state.routes.selectedRoute
  }))));

  // UseRef hooks
  const isInitialMount = useRef(true);

  // UseState hooks
  const [processedCameras, setProcessedCameras] = useState([]);

  // UseEffect hooks and data functions
  const getCamerasData = async () => {
    isInitialMount.current = false;

    const newRouteTimestamp = selectedRoute ? selectedRoute.searchTimestamp : null;

    if (!cameras || (camTimeStamp != newRouteTimestamp)) {
      dispatch(updateCameras({
        list: await getCameras(selectedRoute ? selectedRoute.points : null),
        routeTimeStamp: selectedRoute ? selectedRoute.searchTimestamp : null,
      }));
    }

    // Deep clone and add group reference to each cam
    const clonedCameras = JSON.parse(JSON.stringify(cameras));
    const finalCameras = addCameraGroups(clonedCameras);

    // Sort cameras by highway number and highway_cam_order
    finalCameras.sort(function(a, b) {
      const highwayCompare = collator.compare(a.highway, b.highway);
      if (highwayCompare == 0) {
        return collator.compare(a.highway_cam_order, b.highway_cam_order);
      }

      return highwayCompare;
    });

    setProcessedCameras(finalCameras);
  };

  useEffect(() => {
    if (isInitialMount.current) { // Run only on startup
      getCamerasData();

      const scrollPosition = sessionStorage.getItem('scrollPosition');
      if (scrollPosition) {
        window.scrollTo(0, parseInt(scrollPosition, 10));
      }
    }
  });

  return (
    <div className="cameras-page">
      <PageHeader
        title="Cameras"
        description="Search by camera name to filter results or scroll to view all cameras sorted by highway.">
      </PageHeader>
      <CameraList cameras={processedCameras}></CameraList>
      <Footer />
    </div>
  );
}
