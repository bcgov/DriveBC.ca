// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Redux
import { memoize } from 'proxy-memoize'
import { useSelector, useDispatch } from 'react-redux'
import { updateAdvisories } from '../slices/cmsSlice';
import { updateCameras } from '../slices/feedsSlice';

// External imports
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { booleanIntersects, point, multiPolygon } from '@turf/turf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag,
  faRoute,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { faRoute as faRouteEmpty } from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

// Internal Imports
import { CMSContext } from '../App';
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
import HighwayFilter from '../Components/shared/HighwayFilter.js';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import RouteSearch from '../Components/routing/RouteSearch';
import trackEvent from '../Components/shared/TrackEvent.js';
import AdvisoriesPanel from '../Components/map/panels/AdvisoriesPanel';
import PollingComponent from '../Components/shared/PollingComponent';
import { CamsContext } from '../App.js';


// Styling
import './CamerasListPage.scss';
import '../Components/shared/Filters.scss';

export default function CamerasListPage() {
  /* Setup */
  document.title = 'DriveBC - Cameras';

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);
  const { camsContext, setCamsContext } = useContext(CamsContext);

  // Redux
  const dispatch = useDispatch();
  const { advisories, cameras, filteredCameras, camFilterPoints, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    cameras: state.feeds.cameras.list,
    filteredCameras: state.feeds.cameras.filteredList,
    camFilterPoints: state.feeds.cameras.filterPoints,
    selectedRoute: state.routes.selectedRoute
  }))));

  // Refs
  const isInitialMount = useRef(true);
  const selectedRouteRef = useRef();

  // States
  const [advisoriesInRoute, setAdvisoriesInRoute] = useState([]);
  const [displayedCameras, setDisplayedCameras] = useState(null);
  const [processedCameras, setProcessedCameras] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [openAdvisoriesOverlay, setOpenAdvisoriesOverlay] = useState(false);
  const [openSearchOverlay, setOpenSearchOverlay] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [combinedCameras, setCombinedCameras] = useState(null);

  // Function to handle the state update from child
  const handleShowSpinnerChange = (value) => {
    setShowSpinner(value);
    if (value) {
      setShowLoader(true);
    }
  };

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  // Media queries
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');
  const xXlargeScreen = useMediaQuery('only screen and (min-width : 1200px)');

  // Data functions
  const getCamerasData = async route => {
    const routePoints = route ? route.points : null;

    // Load if filtered cams don't exist or route doesn't match
    if (!filteredCameras || !compareRoutePoints(routePoints, camFilterPoints)) {
      // Fetch data
      const camData = await getCameras().catch((error) => displayError(error));

      // Filter data by route
      const filteredCamData = route && route.routeFound ? filterByRoute(camData, route, null, true) : camData;

      dispatch(
        updateCameras({
          list: camData,
          filteredList: filteredCamData,
          filterPoints: route ? route.points : null,
          timeStamp: new Date().getTime()
        })
      );
    }

    setTimeout(function() {
      setShowLoader(false);
    }, 300);
  };

  const markAdvisoriesAsRead = (advisoriesData) => {
    const advisoriesIds = advisoriesData.map(advisory => advisory.id.toString() + '-' + advisory.live_revision.toString());

    // Combine and remove duplicates
    const readAdvisories = Array.from(new Set([...advisoriesIds, ...cmsContext.readAdvisories]));
    const updatedContext = {...cmsContext, readAdvisories: readAdvisories};

    setCMSContext(updatedContext);
    localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
  }

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
    const resAdvisories = !selectedRoute || !selectedRoute.routeFound ? advData : [];

    // Route selected, load advisories that intersect with at least one cam on route
    if (selectedRoute && selectedRoute.routeFound && advData && advData.length > 0 && camsData && camsData.length > 0) {
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
    if (largeScreen) {
      markAdvisoriesAsRead(resAdvisories);
    }
  };

  // To get the updated processed cameras during search when the potential matches not in the original processed cameras
  const getUpdatedProcessedCameras = (cameras, searchFn) => {
    const result = [];  
    const matchedCams = combinedCameras.filter((pc) => searchFn(pc, searchText));      
    const seenGroups = new Set();

    // Add the matched cameras to the result list and make sure there is only one camera from each group
    matchedCams.forEach((pc) => {
      if (!seenGroups.has(pc.group)) {
        result.push(pc);
        seenGroups.add(pc.group);
      }
    });

    return result;
  } 

  // Effects
  useEffect(() => {
    selectedRouteRef.current = selectedRoute;
    getCamerasData(selectedRoute);
  }, [selectedRoute]);

  useEffect(() => {
    if (filteredCameras) {
      // Deep clone and add group reference to each cam
      const clonedCameras = structuredClone(filteredCameras);
      const finalCameras = addCameraGroups(clonedCameras);
      setCombinedCameras(clonedCameras);

      // Sort cameras by highway number and route_order
      finalCameras.sort(function(a, b) {
        // Route exists, sort by route projection distance only
        if (selectedRoute && selectedRoute.routeFound) {
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
      if(pc.name.trim().toLowerCase().includes(targetText.toLowerCase())
        || pc.caption.trim().toLowerCase().includes(targetText.toLowerCase())) {
        return true;
      } else {
        return false;
      }
    }

    if(searchText.trim() === '') {
      const filteredCams = !searchText ? processedCameras :
      processedCameras.filter((pc) => searchFn(pc, searchText));
      setDisplayedCameras(filteredCams);
    } else {
      const updatedProcessedCameras = getUpdatedProcessedCameras(combinedCameras, searchFn);
      const filteredCams = updatedProcessedCameras.filter((pc) => searchFn(pc, searchText));
      setDisplayedCameras(filteredCams);
    }    

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

  // Sub components
  const getHighwayDisplay = (highway) => {
    return !isNaN(highway.charAt(0)) ? 'Highway ' + highway : highway;
  }

  return (
    <React.Fragment>
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

        <Container className="container--sidepanel">
          { xXlargeScreen &&
            <div className="container--sidepanel__left">
              <RouteSearch showFilterText={true} showSpinner={showSpinner} onShowSpinnerChange={handleShowSpinnerChange}/>
              <Advisories advisories={advisoriesInRoute} selectedRoute={selectedRoute} />
            </div>
          }

          <div className="container--sidepanel__right">
            <div className="controls-container">
              {!xXlargeScreen && (advisoriesInRoute && advisoriesInRoute.length > 0) &&
                <Button
                  className={'advisories-btn'}
                  aria-label="open advisories list"
                  onClick={() => setOpenAdvisoriesOverlay(!openAdvisoriesOverlay)}>
                  <span className="advisories-title">
                    <FontAwesomeIcon icon={faFlag} />
                    Advisories
                  </span>
                  <span className="advisories-count">{advisoriesInRoute.length}</span>
                </Button>
              }

              {!xXlargeScreen &&
                <Button
                  className={`findRoute-btn ${(selectedRoute && selectedRoute.routeFound) ? 'routeFound' : ''}`}
                  variant="outline-primary"
                  aria-label={(selectedRoute && selectedRoute.routeFound)? 'Edit route' : 'Find route'}
                  onClick={() => setOpenSearchOverlay(!openSearchOverlay)}>
                    <FontAwesomeIcon icon={(selectedRoute && selectedRoute.routeFound) ? faRoute : faRouteEmpty } />
                    {(selectedRoute && selectedRoute.routeFound)? 'Edit route' : 'Find route'}
                </Button>
              }

              <div className="camSearch-container">
                <AsyncTypeahead
                  id="camera-name-search"
                  isLoading={false}
                  onSearch={() => {}}
                  onBlur={() => {
                    trackEvent('cameras', 'camera-list', 'search', searchText)}}
                  onInputChange={(text) => setSearchText(text)}
                  placeholder={"Search by camera name"}
                  inputProps={{
                    'aria-label': 'input field for camera name search',
                  }}
                >
                {({ onClear, text }) => (
                  <>
                    {text &&
                      <button
                        className='clear-btn'
                        aria-label={'Clear camera name search'}
                        onClick={onClear}>
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    }
                  </>
                )}
                </AsyncTypeahead>
              </div>

              <HighwayFilter cameras={filteredCameras} />
              
            </div>

            {(!xXlargeScreen && camsContext.highwayFilterKey) &&
            <div className="selected-filters-container">
              <span className="filtering-by">Filtering by </span>
              <div className="selected-filter">
                <div className="selected-filter-text">
                  {camsContext.highwayFilterKey ? getHighwayDisplay(camsContext.highwayFilterKey) : 'Highway'}
                </div>
                <div
                  className="remove-btn"
                  tabIndex={0}
                  onClick={() => setCamsContext({...camsContext, highwayFilterKey: null})}
                  onKeyPress={() => setCamsContext({...camsContext, highwayFilterKey: null})}>
                  <FontAwesomeIcon icon={faXmark} />
                </div>
              </div>
            </div>
            }

            <CameraList cameras={ displayedCameras ? displayedCameras : [] } showLoader={showLoader} enableHighwayFilter={true}></CameraList>

            {(!showLoader && !(displayedCameras && displayedCameras.length)) &&
              <div className="empty-cam-display">
                <h2>No cameras to display</h2>

                <h6><b>Do you have a starting location and a destination entered?</b></h6>
                <p>Adding a route will narrow down the information for the whole site, including the camera list. There might not be any cameras between those two locations.</p>

                <h6><b>Have you entered search terms to narrow down the list?</b></h6>
                <p>Try checking your spelling, changing, or removing your search terms.</p>
              </div>
            }
          </div>
          </Container>
        <Footer />
      </div>

      {!xXlargeScreen && (advisoriesInRoute && advisoriesInRoute.length > 0) &&
        <div className={`overlay advisories-overlay popup--advisories ${openAdvisoriesOverlay ? 'open' : ''}`}>
          <button
            className="close-panel close-overlay"
            aria-label={`${openAdvisoriesOverlay ? 'close overlay' : ''}`}
            aria-hidden={`${openAdvisoriesOverlay ? false : true}`}
            tabIndex={`${openAdvisoriesOverlay ? 0 : -1}`}
            onClick={() => setOpenAdvisoriesOverlay(!openAdvisoriesOverlay)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <AdvisoriesPanel advisories={advisories} openAdvisoriesOverlay={openAdvisoriesOverlay} />
        </div>
      }

      {!xXlargeScreen &&
        <div className={`overlay search-overlay ${openSearchOverlay ? 'open' : ''}`}>
          <button
            className="close-overlay"
            aria-label={`${openSearchOverlay ? 'close overlay' : ''}`}
            aria-labelledby="button-close-overlay"
            aria-hidden={`${openSearchOverlay ? false : true}`}
            tabIndex={`${openSearchOverlay ? 0 : -1}`}
            onClick={() => setOpenSearchOverlay(!openSearchOverlay)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <p className="overlay__header bold">Find route</p>
          <RouteSearch showFilterText={true} showSpinner={showSpinner} onShowSpinnerChange={handleShowSpinnerChange}/>
        </div>
      }

      <PollingComponent runnable={() => getCamerasData(selectedRouteRef.current)} interval={30000} />

    </React.Fragment>
  );
}
