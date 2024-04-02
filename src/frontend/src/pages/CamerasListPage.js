// React
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories } from '../slices/cmsSlice';
import { updateCameras } from '../slices/feedsSlice';

// Third party components
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { booleanIntersects, point, polygon } from '@turf/turf';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

// Components and functions
import { getAdvisories } from '../Components/data/advisories';
import { collator, getCameras, addCameraGroups } from '../Components/data/webcams';
import Advisories from '../Components/advisories/Advisories';
import CameraList from '../Components/cameras/CameraList';
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';
import RouteSearch from '../Components/map/RouteSearch';

// Styling
import './CamerasListPage.scss';

export default function CamerasListPage() {
  document.title = 'DriveBC - Cameras';

  // Redux
  const dispatch = useDispatch();
  const { advisories, cameras, camTimeStamp, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    cameras: state.feeds.cameras.list,
    camTimeStamp: state.feeds.cameras.routeTimeStamp,
    selectedRoute: state.routes.selectedRoute
  }))));

  // UseRef hooks
  const isInitialMount = useRef(true);

  // UseState hooks
  const [advisoriesInRoute, setAdvisoriesInRoute] = useState([]);
  const [displayedCameras, setDisplayedCameras] = useState(null);
  const [processedCameras, setProcessedCameras] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Data functions
  const getCamerasData = async () => {
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
    getAdvisoriesData(finalCameras);
  };

  const getAdvisoriesData = async (camsData) => {
    let advData = advisories;

    if (!advisories) {
      advData = await getAdvisories();

      dispatch(updateAdvisories({
        list: advData,
        timeStamp: new Date().getTime()
      }));
    }

    // load all advisories if no route selected
    const resAdvisories = !selectedRoute ? advData : [];

    // Route selected, load advisories that intersect with at least one cam on route
    if (selectedRoute && advData && advData.length > 0 && camsData && camsData.length > 0) {
      for (const adv of advData) {
        const advPoly = polygon(adv.geometry.coordinates);

        for (const cam of camsData) {
          const camPoint = point(cam.location.coordinates);
          if (booleanIntersects(advPoly, camPoint)) {
            // advisory intersects with a camera, add to list and break loop
            resAdvisories.push(adv);
            break;
          }
        }
      }
    }

    setAdvisoriesInRoute(resAdvisories);
  };

  // useEffect hooks
  useEffect(() => {
    getCamerasData();

  }, [selectedRoute]);

  useEffect(() => {
    // Search name and caption of all cams in group
    const searchFn = (pc, targetText) => {
      for (let i = 0; i < pc.camGroup.length; i++) {
        if (pc.camGroup[i].name.toLowerCase().includes(targetText.toLowerCase()) ||
          pc.camGroup[i].caption.toLowerCase().includes(targetText.toLowerCase())) {

          return true;
        }
      }

      return false;
    }

    const filteredCams = !searchText ? processedCameras :
      processedCameras.filter((pc) => searchFn(pc, searchText));

    setDisplayedCameras(filteredCams);

  }, [searchText, processedCameras]);

  useEffect(() => {
    if (isInitialMount.current) {
      const scrollPosition = sessionStorage.getItem('scrollPosition');
      if (scrollPosition) {
        setTimeout(function() {
          window.scrollTo({
            top: parseInt(scrollPosition, 10),
            left: 0,
            behavior: "smooth"
          });
        }, 300);
      }

      isInitialMount.current = false;
    }
  }, [displayedCameras]);

  // Rendering
  return (
    <div className="cameras-page">
      <PageHeader
        title="Cameras"
        description="Scroll to view all cameras sorted by highway.">
      </PageHeader>

      <Container className="outer-container">
        <Advisories advisories={advisoriesInRoute} />

        <div className="controls-container">
          <div className="route-display-container">
            <RouteSearch showFilterText={true} />
          </div>

          <div className="search-container">
            <AsyncTypeahead
              id="camera-name-search"
              isLoading={false}
              onSearch={() => {}}
              onInputChange={(text) => setSearchText(text)}
              placeholder={"Find by camera name"}
              inputProps={{
                'aria-label': 'input field for camera name search',
              }}
            />
          </div>
        </div>
      </Container>

      <CameraList cameras={ displayedCameras ? displayedCameras : [] }></CameraList>

      {!(displayedCameras && displayedCameras.length) &&
        <Container className="empty-cam-display">
          <h2>No cameras to display</h2>

          <h6><b>Do you have a starting location and a destination entered?</b></h6>
          <p>Adding a route will narrow down the information for the whole site, including the camera list. There might not be any cameras between those two locations.</p>

          <h6><b>Have you entered search terms to narrow down the list?</b></h6>
          <p>Try checking your spelling, changing, or removing your search terms.</p>
        </Container>
      }

      <Footer />
    </div>
  );
}
