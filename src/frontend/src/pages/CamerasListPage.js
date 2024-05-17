// React
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateAdvisories } from '../slices/cmsSlice';
import { updateCameras } from '../slices/feedsSlice';

// Third party components
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { booleanIntersects, point, multiPolygon } from '@turf/turf';
import Container from 'react-bootstrap/Container';

// Components and functions
import {
  compareRoutePoints,
  filterByRoute
} from '../Components/map/helpers';
import { getAdvisories } from '../Components/data/advisories';
import { collator, getCameras, addCameraGroups } from '../Components/data/webcams';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Advisories from '../Components/advisories/Advisories';
import CameraList from '../Components/cameras/CameraList';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import RouteSearch from '../Components/routing/RouteSearch';
import trackEvent from '../Components/shared/TrackEvent.js';

// Styling
import './CamerasListPage.scss';

export default function CamerasListPage() {
  document.title = 'DriveBC - Cameras';

  // Redux
  const dispatch = useDispatch();
  const { advisories, cameras, filteredCameras, camFilterPoints, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    cameras: state.feeds.cameras.list,
    filteredCameras: state.feeds.cameras.filteredList,
    camFilterPoints: state.feeds.cameras.filterPoints,
    selectedRoute: state.routes.selectedRoute
  }))));

  // UseRef hooks
  const isInitialMount = useRef(true);

  // UseState hooks
  const [advisoriesInRoute, setAdvisoriesInRoute] = useState([]);
  const [displayedCameras, setDisplayedCameras] = useState(null);
  const [processedCameras, setProcessedCameras] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  // Data functions
  const getCamerasData = async route => {
    const routePoints = route ? route.points : null;

    // Load if filtered cams don't exist or route doesn't match
    if (!filteredCameras || !compareRoutePoints(routePoints, camFilterPoints)) {
      // Fetch data if it doesn't already exist
      const camData = cameras ? cameras : await getCameras().catch((error) => displayError(error));

      // Filter data by route
      const filteredCamData = route ? filterByRoute(camData, route, null, true) : camData;

      dispatch(
        updateCameras({
          list: camData,
          filteredList: filteredCamData,
          filterPoints: route ? route.points : null
        })
      );
    }
  };

  const getAdvisoriesData = async (camsData) => {
    let advData = advisories;

    if (!advisories) {
      advData = await getAdvisories().catch((error) => displayError(error));

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
        const advPoly = multiPolygon(adv.geometry.coordinates);

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
    getCamerasData(selectedRoute);

  }, [selectedRoute]);

  useEffect(() => {
    if (filteredCameras) {
      // Deep clone and add group reference to each cam
      const clonedCameras = JSON.parse(JSON.stringify(filteredCameras));
      const finalCameras = addCameraGroups(clonedCameras);

      // Sort cameras by highway number and route_order
      finalCameras.sort(function(a, b) {
        // Route exists, sort by route projection distance only
        if (selectedRoute) {
          return collator.compare(a.route_projection, b.route_projection);

        // No route, sort by highway first, then default highway/route order
        } else {
          const highwayCompare = collator.compare(a.highway_display, b.highway_display);
          if (highwayCompare == 0) {
            return collator.compare(a.route_order, b.route_order);
          }

          return highwayCompare;
        }
      });

      setProcessedCameras(finalCameras);
      getAdvisoriesData(finalCameras);
    }
  }, [filteredCameras]);

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
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

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
              onBlur={() => {
                trackEvent('cameras', 'camera-list', 'search', searchText)}}
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
