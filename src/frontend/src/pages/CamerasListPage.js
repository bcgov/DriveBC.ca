// React
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'

// Third party components
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

// Components and functions
import { collator, getCameras, addCameraGroups } from '../Components/data/webcams';
import { updateCameras } from '../slices/feedsSlice';
import Advisories from '../Components/advisories/Advisories';
import CameraList from '../Components/cameras/CameraList';
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';
import RouteSearch from '../Components/map/RouteSearch';

// Styling
import './CamerasListPage.scss';

export default function CamerasListPage() {
  // Redux
  const dispatch = useDispatch();
  const { cameras, camTimeStamp, selectedRoute } = useSelector(useCallback(memoize(state => ({
    cameras: state.feeds.cameras.list,
    camTimeStamp: state.feeds.cameras.routeTimeStamp,
    selectedRoute: state.routes.selectedRoute
  }))));

  // UseRef hooks
  const isInitialMount = useRef(true);

  // UseState hooks
  const [routeEdit, setRouteEdit] = useState(!(selectedRoute && selectedRoute.routeFound));
  const [processedCameras, setProcessedCameras] = useState(null);

  // UseEffect hooks and data functions
  useEffect(() => {
    const scrollPosition = sessionStorage.getItem('scrollPosition');
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition, 10));
    }
  });

  const getCamerasData = async () => {
    isInitialMount.current = false;

    const newRouteTimestamp = selectedRoute ? selectedRoute.searchTimestamp : null;

    let tempCams = cameras;
    if (!tempCams || (camTimeStamp != newRouteTimestamp)) {
      tempCams = await getCameras(selectedRoute ? selectedRoute.points : null);

      dispatch(updateCameras({
        list: tempCams,
        routeTimeStamp: selectedRoute ? selectedRoute.searchTimestamp : null,
        timeStamp: new Date().getTime()
      }));
    }

    // Deep clone and add group reference to each cam
    const clonedCameras = JSON.parse(JSON.stringify(tempCams));
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
    getCamerasData();

    if (selectedRoute && selectedRoute.routeFound) {
      setRouteEdit(false);
    }
  }, [selectedRoute]);

  return (
    <div className="cameras-page">
      <PageHeader
        title="Cameras"
        description="Scroll to view all cameras sorted by highway.">
      </PageHeader>

      <Container className="outer-container">
        <Advisories />

        <div className="route-display-container">
          <RouteSearch routeEdit={routeEdit} />

          {!routeEdit &&
            <Button onClick={() => setRouteEdit(true)}>Change</Button>
          }
        </div>
      </Container>

      <CameraList cameras={processedCameras}></CameraList>

      <Footer />
    </div>
  );
}
