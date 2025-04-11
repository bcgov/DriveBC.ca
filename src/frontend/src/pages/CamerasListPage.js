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
  faRoute,
  faXmark,
  faXmarkLarge,
  faMagnifyingGlass,
  faChevronDown
} from '@fortawesome/pro-solid-svg-icons';
import { faRoute as faRouteEmpty } from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

// Internal Imports
import { CamsContext, CMSContext } from '../App';
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
import HighwayFilter from '../Components/shared/HighwayFilter.js';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import RouteSearch from '../Components/routing/RouteSearch';
import trackEvent from '../Components/shared/TrackEvent.js';
import AdvisoriesPanel from '../Components/map/panels/AdvisoriesPanel';
import PollingComponent from '../Components/shared/PollingComponent';

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
  const { advisories, filteredAdvisories, cameras, filteredCameras, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    filteredAdvisories: state.cms.advisories.filteredList,
    cameras: state.feeds.cameras.list,
    filteredCameras: state.feeds.cameras.filteredList,
    selectedRoute: state.routes.selectedRoute
  }))));

  // Refs
  const isInitialMount = useRef(true);
  const isInitialDataLoad = useRef(true);
  const isInitialAdvisoryLoad = useRef(true);
  const selectedRouteRef = useRef();

  // States
  const [displayedCameras, setDisplayedCameras] = useState(null);
  const [processedCameras, setProcessedCameras] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [openAdvisoriesOverlay, setOpenAdvisoriesOverlay] = useState(false);
  const [openSearchOverlay, setOpenSearchOverlay] = useState(false);
  const [showLoader, setShowLoader] = useState(!cameras);
  const [showSpinner, setShowSpinner] = useState(false);
  const [combinedCameras, setCombinedCameras] = useState(null);
  const [openCameraSearch, setOpenCameraSearch] = useState(false);
  const [showHwyFilters, setShowHwyFilters] = useState(false);
  const [openHwyFiltersOverlay, setOpenHwyFiltersOverlay] = useState(false);

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
  const xXlargeScreen = useMediaQuery('only screen and (min-width : 1200px)');

  // Data functions
  const getCamerasData = async route => {
    if (isInitialDataLoad.current) {
      isInitialDataLoad.current = false;

      // Do not run on initial load if data is present
      if (cameras) {
        return;
      }
    }

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

    setTimeout(function() {
      setShowLoader(false);
    }, 300);
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
      loadAdvisories();
    }
  }, [filteredCameras, selectedRoute]);

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

  // Handle click for highway filters button
  const handleHwyFiltersClick = () => {
    setShowHwyFilters(!showHwyFilters);
    if (smallScreen) {
      setOpenHwyFiltersOverlay(!openHwyFiltersOverlay);
    }
  }

  // Handle close of highway filters overlay
  const handleHwyFiltersClose = () => {
    setOpenHwyFiltersOverlay(!openHwyFiltersOverlay);
    setShowHwyFilters(!showHwyFilters);
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
              <Advisories advisories={filteredAdvisories} selectedRoute={selectedRoute} />
            </div>
          }

          <div className="container--sidepanel__right">
            <div className="controls-container">
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

              {xXlargeScreen &&
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
              }

              <div className="tools-container">
                {xXlargeScreen && <span className="filters-text">Filters: </span>}
                {!xXlargeScreen &&
                  <Button
                    variant="outline-primary"
                    className={'filter-option-btn camera-search-btn' + (openCameraSearch ? ' active' : '')}
                    aria-label="open camera search"
                    onClick={() => setOpenCameraSearch(!openCameraSearch)}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </Button>
                }

                <Button
                  variant="outline-primary"
                  className={'filter-option-btn highway-filter-btn' + (camsContext.highwayFilterKey ? ' filtered' : '') + (showHwyFilters ? ' active' : '')}
                  aria-label="show filters options"
                  onClick={handleHwyFiltersClick}>

                  {xXlargeScreen &&
                    <p className="btn-text">
                      {camsContext.highwayFilterKey ? getHighwayDisplay(camsContext.highwayFilterKey) : 'Highway'}
                    </p>
                  }
                  <svg className="highway-filter-btn__icon" width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.55965 1.74951V0.999722H10.6683V1.74951C10.6683 2.29936 11.0958 2.74924 11.6183 2.74924H15.4373L14.8673 3.91391C14.796 4.05387 14.7628 4.21383 14.7628 4.36879V13.0214C14.796 13.6212 14.5633 14.5959 13.675 15.4307C12.7916 16.2605 11.2098 16.9903 8.49287 16.9903C5.77591 16.9903 4.19894 16.2605 3.3107 15.4307C2.42246 14.5959 2.18972 13.6212 2.22297 13.0214V13.0064V12.9914V4.36879C2.22297 4.20883 2.18497 4.05387 2.11847 3.91391L1.55323 2.74924H5.60967C6.13216 2.74924 6.55965 2.29936 6.55965 1.74951ZM6.13216 0C5.84241 0 5.60967 0.244932 5.60967 0.549847V1.74951H0L0.356245 2.47931L1.27773 4.37379V12.9864C1.23498 13.8861 1.58173 15.1508 2.68371 16.1855C3.79519 17.2302 5.62392 18 8.49762 18C11.3713 18 13.2001 17.2302 14.3115 16.1855C15.4135 15.1508 15.7603 13.8861 15.7175 12.9864V4.36879L16.6438 2.47931L17 1.74951H11.6278V0.549847C11.6278 0.244932 11.3951 0 11.1053 0H6.14166H6.13216ZM6.00866 6.32824C6.36966 6.32824 6.68315 6.35324 6.95865 6.40322C7.23414 6.45321 7.46214 6.53319 7.64739 6.64815C7.83263 6.75812 7.97038 6.90808 8.06538 7.09303C8.16038 7.27798 8.20788 7.50292 8.20788 7.77784C8.20788 8.10275 8.13663 8.37767 7.99413 8.60261C7.85163 8.82755 7.64264 8.96251 7.37189 9.0125V9.05249C7.50964 9.08248 7.63314 9.12746 7.75189 9.18745C7.87063 9.24743 7.97038 9.32741 8.06063 9.42738C8.15088 9.52736 8.21738 9.65732 8.26963 9.81727C8.32188 9.97223 8.34563 10.1672 8.34563 10.3871C8.34563 10.642 8.29813 10.872 8.20313 11.0769C8.10813 11.2819 7.97513 11.4568 7.80413 11.6018C7.63314 11.7467 7.42414 11.8567 7.17714 11.9317C6.93015 12.0067 6.65465 12.0417 6.35066 12.0417H4.32244V6.33324H6.00866V6.32824ZM6.14166 8.58762C6.47415 8.58762 6.7069 8.53263 6.83515 8.42766C6.9634 8.32269 7.0299 8.15773 7.0299 7.9328C7.0299 7.70786 6.9539 7.5479 6.80665 7.45793C6.6594 7.36296 6.41716 7.31797 6.07991 7.31797H5.47192V8.58762H6.14166ZM5.47192 9.54735V11.0369H6.22241C6.56915 11.0369 6.80665 10.967 6.9444 10.827C7.08215 10.687 7.14864 10.4971 7.14864 10.2621C7.14864 10.0472 7.0774 9.87726 6.93965 9.74729C6.8019 9.61733 6.55015 9.55235 6.18441 9.55235H5.47192V9.54735ZM11.7323 7.25299C11.2906 7.25299 10.9533 7.42794 10.7206 7.77284C10.4878 8.11775 10.3691 8.59261 10.3691 9.19745C10.3691 9.80228 10.4783 10.2771 10.6921 10.6071C10.9058 10.942 11.2526 11.1069 11.7276 11.1069C11.9461 11.1069 12.1646 11.0819 12.3878 11.0269C12.6111 10.972 12.8533 10.897 13.1098 10.802V11.8167C12.8723 11.9167 12.6348 11.9917 12.4021 12.0417C12.1693 12.0916 11.9081 12.1116 11.6183 12.1116C11.0578 12.1116 10.5971 11.9917 10.2361 11.7467C9.8751 11.5018 9.60911 11.1619 9.43811 10.722C9.26711 10.2821 9.18161 9.76729 9.18161 9.18245C9.18161 8.59761 9.28136 8.09775 9.47611 7.65287C9.67561 7.208 9.9606 6.86309 10.3406 6.61316C10.7158 6.36323 11.1813 6.23827 11.7276 6.23827C11.9936 6.23827 12.2643 6.27326 12.5351 6.34824C12.8058 6.41822 13.0671 6.51819 13.3141 6.63816L12.9436 7.62288C12.7393 7.52291 12.5351 7.43294 12.3308 7.35796C12.1266 7.28298 11.9223 7.24799 11.7276 7.24799L11.7323 7.25299Z" fill="currentColor" />
                  </svg>
                  {xXlargeScreen &&
                    <FontAwesomeIcon className="dropdown-icon" icon={faChevronDown} />
                  }
                </Button>

                {!smallScreen && showHwyFilters &&
                  <HighwayFilter cameras={filteredCameras} handleHwyFiltersClose={handleHwyFiltersClose} />
                }

                {!xXlargeScreen && (filteredAdvisories && filteredAdvisories.length > 0) &&
                  <Button
                    className={'advisories-btn'}
                    aria-label="open advisories list"
                    onClick={() => setOpenAdvisoriesOverlay(!openAdvisoriesOverlay)}>
                    <span className="advisories-title">
                      <FontAwesomeIcon icon={faFlag} />
                    </span>
                    <span className="advisories-count">{filteredAdvisories.length}</span>
                  </Button>
                }
              </div>
            </div>

            {!xXlargeScreen &&
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
              <Button
                className="close-camera-search-btn"
                aria-label="close camera search"
                onClick={() => setOpenCameraSearch(!openCameraSearch)}>
                <FontAwesomeIcon icon={faXmarkLarge} />
              </Button>
            </div>
            }

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

      {!xXlargeScreen && (filteredAdvisories && filteredAdvisories.length > 0) &&
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

      {smallScreen &&
        <div className={`overlay filters-overlay ${openHwyFiltersOverlay ? 'open' : ''}`}>
          <button
            className="close-overlay"
            aria-label={`${openHwyFiltersOverlay ? 'close overlay' : ''}`}
            aria-labelledby="button-close-overlay"
            aria-hidden={`${openHwyFiltersOverlay ? false : true}`}
            tabIndex={`${openHwyFiltersOverlay ? 0 : -1}`}
            onClick={handleHwyFiltersClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <p className="overlay__header bold">Filter by highway</p>
          <HighwayFilter cameras={filteredCameras} handleHwyFiltersClose={handleHwyFiltersClose} />
        </div>
      }

      <PollingComponent runnable={() => getCamerasData(selectedRouteRef.current)} interval={30000} />

    </React.Fragment>
  );
}
