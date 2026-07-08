// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Redux
import { memoize } from 'proxy-memoize'
import { useSelector, useDispatch } from 'react-redux'
import { updateAdvisories } from '../slices/cmsSlice';
import { updateCameras } from '../slices/feedsSlice';

// External imports
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag,
  faXmark,
  faMagnifyingGlass,
  faFilter,
  faSliders
} from '@fortawesome/pro-solid-svg-icons';
import {
  faArrowUpArrowDown
} from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import cloneDeep from 'lodash/cloneDeep';

// Internal Imports
import { CMSContext, FilterContext } from '../App';
import {
  filterAdvisoryByRoute,
  filterByRoute
} from '../Components/map/helpers';
import { getAdvisories } from '../Components/data/advisories';
import { collator, getCameras, addCameraGroups } from '../Components/data/webcams';
import { markAdvisoriesAsRead } from '../Components/data/advisories';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Advisories from '../Components/advisories/Advisories';
import CameraList from '../Components/cameras/CameraList';
import AreaFilter from '../Components/shared/AreaFilter.js';
import HighwayFilter from '../Components/shared/HighwayFilter.js';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import RouteSearch from '../Components/routing/RouteSearch';
import trackEvent from '../Components/shared/TrackEvent.js';
import AdvisoriesPanel from '../Components/map/panels/AdvisoriesPanel';
import PollingComponent from '../Components/shared/PollingComponent';
import ListFilters from "../Components/shared/ListFilters";

// Styling
import './CamerasListPage.scss';

export default function CamerasListPage() {
  /* Setup */
  document.title = 'DriveBC - Cameras';

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);
  const { filterContext, setFilterContext } = useContext(FilterContext);

  // Redux
  const dispatch = useDispatch();
  const { advisories, filteredAdvisories, cameras, filteredCameras, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    filteredAdvisories: state.cms.advisories.filteredList,
    cameras: state.feeds.cameras.list,
    filteredCameras: state.feeds.cameras.filteredList,
    selectedRoute: state.routes.selectedRoute
  }))));

  // Refs
  const isInitialMount = useRef(true);
  const isInitialAdvisoryLoad = useRef(true);
  const selectedRouteRef = useRef();

  // States
  const [displayedCameras, setDisplayedCameras] = useState(null);
  const [onscreenCameras, setOnscreenCameras] = useState([]);
  const [processedCameras, setProcessedCameras] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [openAdvisoriesOverlay, setOpenAdvisoriesOverlay] = useState(false);
  const [showLoader, setShowLoader] = useState(!cameras);
  const [showSpinner, setShowSpinner] = useState(false);
  const [combinedCameras, setCombinedCameras] = useState(null);
  const [openCameraSearch, setOpenCameraSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
  const smallScreen = useMediaQuery('only screen and (max-width : 575px)');
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Data functions
  const getCamerasData = async route => {
    // Fetch data
    const camData = await getCameras().catch((error) => displayError(error));

    // Filter data by route
    const filteredCamData = route && route.routeFound ? filterByRoute(camData, route, null, true) : camData;

    dispatch(
      updateCameras({
        list: camData,
        filteredList: filteredCamData,
        timeStamp: new Date().getTime()
      })
    );
  };

  const loadAdvisories = async () => {
    // Skip loading if the advisories are already loaded on launch
    if (advisories && isInitialAdvisoryLoad.current) {
      isInitialAdvisoryLoad.current = false;
      return;
    }

    const advisoriesData = await getAdvisories().catch((error) => displayError(error));
    const filteredAdvisoriesData = selectedRoute ? filterAdvisoryByRoute(advisoriesData, selectedRoute) : advisoriesData;
    dispatch(updateAdvisories({
      list: advisoriesData,
      filteredList: filteredAdvisoriesData,
      timeStamp: new Date().getTime()
    }));

    if (largeScreen) {
      markAdvisoriesAsRead(filteredAdvisoriesData, cmsContext, setCMSContext);
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
    if (filteredCameras) {
      // Deep clone and add group reference to each cam
      const clonedCameras = typeof structuredClone === 'function' ? structuredClone(filteredCameras) : cloneDeep(filteredCameras);
      setCombinedCameras(clonedCameras);

      const groupedCameras = addCameraGroups(clonedCameras);
      setProcessedCameras(groupedCameras);

      loadAdvisories();
    }
  }, [filteredCameras]);

  useEffect(() => {
    if (!processedCameras) {
      return;
    }

    // Search name and caption of all cams in group
    const searchFn = (pc, targetText) => {
      return pc.name.trim().toLowerCase().includes(targetText.toLowerCase())
        || pc.caption.trim().toLowerCase().includes(targetText.toLowerCase());
    }

    let resCams;

    // Apply search filter
    if (searchText.trim() === '') {
      // No text, show all processed cams
      resCams = processedCameras;

    } else {
      // Text entered, filter processed cams by search text
      const updatedProcessedCameras = getUpdatedProcessedCameras(combinedCameras, searchFn);
      resCams = updatedProcessedCameras.filter((pc) => searchFn(pc, searchText));
    }

    // Apply highway filter
    if (filterContext.highwayFilterKey) {
      resCams = resCams.filter((camera) => (camera.highway_display === filterContext.highwayFilterKey));
    }

    // Apply area filter
    if (filterContext.areaFilter) {
      resCams = resCams.filter((camera) => (camera.area === filterContext.areaFilter.id));
    }

    // Sort cameras by highway number and route_order
    resCams.sort(function(a, b) {
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

    setDisplayedCameras(resCams);

  }, [searchText, processedCameras, filterContext.highwayFilterKey, filterContext.areaFilter]);

  useEffect(() => {
    if (isInitialMount.current) {
      const scrollPosition = sessionStorage.getItem('scrollPosition');
      if (scrollPosition) {
        const scrollableContainer = document.querySelector('#main');

        setTimeout(function() {
          scrollableContainer.scrollTo({
            top: parseInt(scrollPosition, 10),
            left: 0,
            behavior: "instant"
          });

          sessionStorage.setItem('scrollPosition', 0);
        }, 300);
      }

      isInitialMount.current = false;

    } else {
      setShowLoader(false);
    }
  }, [displayedCameras]);

  // Handle sticky filters on mobile
  useEffect(() => {
    const sentinel = document.querySelector('.sticky-sentinel');
    const target = document.querySelector('.sticky-filters');
    if (!sentinel || !target) return;

    let rafId = null;

    const updateStuck = (entry) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const isStuck = entry.intersectionRatio === 0;
        target.toggleAttribute('stuck', isStuck);
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => updateStuck(entry),
      {
        root: null,
        threshold: [0],
        rootMargin: '-120px 0px 0px 0px',
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    selectedRouteRef.current = selectedRoute;
    setShowLoader(true);
    getCamerasData(selectedRoute);
  }, [selectedRoute]);

  // Sub components
  const getHighwayDisplay = (highway) => {
    return !isNaN(highway.charAt(0)) ? 'Highway ' + highway : highway;
  }

  // Count of active filters, used for the Filters button badge/state
  const activeFilterCount = (filterContext.areaFilter ? 1 : 0) + (filterContext.highwayFilterKey ? 1 : 0);

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
          { !smallScreen &&
            <div className="container--sidepanel__left">
              <RouteSearch showFilterText={true} showSpinner={showSpinner} onShowSpinnerChange={handleShowSpinnerChange}/>
              <Advisories advisories={filteredAdvisories} selectedRoute={selectedRoute} />
            </div>
          }

          <div className="container--sidepanel__right">
            <div className="sticky-sentinel" />
            <div className="sticky-filters">
              <div className="controls-group">
                <div className="controls-container">
                  {!smallScreen &&
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
                        defaultInputValue={searchText}>

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
                  }

                  <div className="tools-container">
                    {smallScreen &&
                      <Button
                        variant="outline-primary"
                        className={'filter-option-btn camera-search-btn' + (openCameraSearch ? ' active' : '')}
                        aria-label="open camera search"
                        onClick={() => {
                          // DBC22-4194: minimal-effort fix to prevent closing search bar when there is text
                          if (searchText && openCameraSearch) return;

                          setOpenCameraSearch(!openCameraSearch);
                        }}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        <span className="mobile-btn-text">Search</span>
                      </Button>
                    }

                    <Button
                      variant="outline-primary"
                      className={'filter-option-btn filters-btn' + (activeFilterCount ? ' filtered' : '') + (showFilters ? ' active' : '')}
                      aria-label="show filters options"
                      onClick={() => setShowFilters(!showFilters)}>

                      <FontAwesomeIcon className="filters-btn__icon" icon={faFilter} />

                      {!smallScreen &&
                        <p className="btn-text">Filters</p>
                      }

                      {smallScreen &&
                        <span className="mobile-btn-text">Filters</span>
                      }

                      {activeFilterCount > 0 &&
                        <span className="filter-count">{activeFilterCount}</span>
                      }
                    </Button>
                  </div>
                </div>

                {smallScreen &&
                  <div className={'camSearch-container camSearch-container--mobile' + (openCameraSearch ? ' open' : '')}>
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
                      defaultInputValue={searchText}>

                    {({ onClear, text }) => (
                      <>
                        {text &&
                          <button
                            className='close-camera-search-btn'
                            aria-label={'Clear camera name search'}
                            onClick={onClear}>
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        }
                      </>
                    )}
                    </AsyncTypeahead>
                  </div>
                }
              </div>

              {(filterContext.highwayFilterKey || filterContext.areaFilter) &&
                <div className="selected-filters-container">
                  {filterContext.highwayFilterKey &&
                    <div className="selected-filter">
                      <div className="selected-filter-text">
                        {filterContext.highwayFilterKey ? getHighwayDisplay(filterContext.highwayFilterKey) : 'Highway'}
                      </div>
                      <div
                        className="remove-btn"
                        tabIndex={0}
                        onClick={() => setFilterContext({...filterContext, highwayFilterKey: null})}
                        onKeyDown={() => setFilterContext({...filterContext, highwayFilterKey: null})}>
                        <FontAwesomeIcon icon={faXmark} />
                      </div>
                    </div>
                  }

                  {filterContext.areaFilter &&
                    <div className="selected-filter">
                      <div className="selected-filter-text">
                        {filterContext.areaFilter ? filterContext.areaFilter.name : 'Highway'}
                      </div>
                      <div
                        className="remove-btn"
                        tabIndex={0}
                        onClick={() => setFilterContext({...filterContext, areaFilter: null})}
                        onKeyDown={() => setFilterContext({...filterContext, areaFilter: null})}>
                        <FontAwesomeIcon icon={faXmark} />
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            {smallScreen && (filteredAdvisories && filteredAdvisories.length > 0) &&
              <Button
                className={'advisories-btn'}
                aria-label="open advisories list"
                onClick={() => setOpenAdvisoriesOverlay(!openAdvisoriesOverlay)}>
                <span className="advisories-title">
                  <FontAwesomeIcon icon={faFlag} />
                  Route advisories
                </span>
                <span className="advisories-count">{filteredAdvisories.length}</span>
              </Button>
            }

            <CameraList
              cameras={ displayedCameras ? displayedCameras : [] }
              onscreenCameras={onscreenCameras}
              setOnscreenCameras={setOnscreenCameras}
              showLoader={showLoader} />

            {!showLoader && displayedCameras && displayedCameras.length === 0 &&
              <div className="empty-cam-display">
                <h2>No cameras to display</h2>

                <h6><b>Do you have a starting location and a destination entered?</b></h6>
                <p>Adding a route will narrow down the information for the whole site, including the camera list. There might not be any cameras between those two locations.</p>

                <h6><b>Have you entered search terms or applied filters (e.g. an area or a highway) to narrow down the list?</b></h6>
                <p>These also narrow down the cameras on this page.</p>
                <ul>
                  <li>Try checking your spelling, changing, or removing your search terms.</li>
                  <li>Remove or adjust the area or highway filters to reveal more cameras.</li>
                </ul>
              </div>
            }
          </div>
        </Container>

        <Footer />
      </div>

      {smallScreen && (filteredAdvisories && filteredAdvisories.length > 0) &&
        <div className={`overlay advisories-overlay popup--advisories ${openAdvisoriesOverlay ? 'open' : ''}`}>
          <button
            className="close-panel close-overlay"
            aria-label={`${openAdvisoriesOverlay ? 'close overlay' : ''}`}
            aria-hidden={`${openAdvisoriesOverlay ? false : true}`}
            tabIndex={`${openAdvisoriesOverlay ? 0 : -1}`}
            onClick={() => setOpenAdvisoriesOverlay(!openAdvisoriesOverlay)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>

          <AdvisoriesPanel advisories={filteredAdvisories} openAdvisoriesOverlay={openAdvisoriesOverlay} />
        </div>
      }

      <div className={`overlay filters-overlay ${showFilters ? 'open' : ''}`}>
        <button
          className="close-overlay"
          aria-label={`${showFilters ? 'close overlay' : ''}`}
          aria-labelledby="button-close-overlay"
          aria-hidden={`${showFilters ? false : true}`}
          tabIndex={`${showFilters ? 0 : -1}`}
          onClick={() => setShowFilters(false)}>

          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="container--header all-filters">
          <div className="filters-overlay__icon icon--all-filters">
            <FontAwesomeIcon icon={faSliders} />
          </div>
          <p className="filters-overlay__header bold">Filters</p>
        </div>
        <div className="container--header sorted-by">
          <div className="filters-overlay__icon icon--sorted-by">
            <FontAwesomeIcon icon={faArrowUpArrowDown} />
          </div>
          <p className="filters-overlay__header bold">Sorted by</p>
        </div>
        <div className="filters-component">
          <p className="filters-overlay__subheader bold">Areas</p>
          <AreaFilter handleAreaFiltersClose={() => {}} objects={displayedCameras} showAllByDefault={true} />

          <p className="filters-overlay__subheader bold">Highways</p>
          {processedCameras && <HighwayFilter cameras={processedCameras} handleHwyFiltersClose={() => {}} showAllByDefault={true} />}
        </div>
      </div>

      <PollingComponent runnable={() => getCamerasData(selectedRouteRef.current)} interval={30000} />

      <ListFilters
        hidden={true}
        disableFeatures={true}
        enableRoadConditions={false}
        enableChainUps={true}
        textOverride={'List'}
        iconOverride={true}
        isDelaysPage={true}
        fullOverlay={true}
      />
    </React.Fragment>
  );
}
