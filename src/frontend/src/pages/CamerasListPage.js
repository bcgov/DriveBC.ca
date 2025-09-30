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
  faChevronDown
} from '@fortawesome/pro-solid-svg-icons';
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
  const [showAreaFilters, setShowAreaFilters] = useState(false);
  const [showHwyFilters, setShowHwyFilters] = useState(false);

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
                    <span className="filters-text">Filters{!smallScreen && ':'} </span>

                    {smallScreen &&
                      <Button
                        variant="outline-primary"
                        className={'filter-option-btn camera-search-btn' + (openCameraSearch ? ' active' : '')}
                        aria-label="open camera search"
                        onClick={() => setOpenCameraSearch(!openCameraSearch)}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        <span className="mobile-btn-text">Search</span>
                      </Button>
                    }

                    <Button
                      variant="outline-primary"
                      className={'filter-option-btn area-filter-btn' + (filterContext.areaFilter ? ' filtered' : '') + (showAreaFilters ? ' active' : '')}
                      aria-label="show area filters options"
                      onClick={() => setShowAreaFilters(!showAreaFilters)}>

                      {!smallScreen &&
                        <p className="btn-text">
                          {filterContext.areaFilter ? filterContext.areaFilter.name : 'Area'}
                        </p>
                      }

                      <svg className="area-filter-btn__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.9933 7.00752C10.9933 8.37761 9.16667 10.817 8.36667 11.8195C8.17333 12.0602 7.82 12.0602 7.62667 11.8195C6.82667 10.817 5 8.37761 5 7.00752C5 5.35004 6.34667 4 8 4C9.65333 4 11 5.35004 11 7.00752H10.9933ZM10.2467 7.00752C10.2467 5.76441 9.24 4.74854 7.99333 4.74854C6.74667 4.74854 5.74 5.75773 5.74 7.00752C5.74 7.20134 5.81333 7.50209 5.98 7.90309C6.14667 8.29073 6.38 8.71846 6.64667 9.15288C7.09333 9.87469 7.60667 10.5764 7.99333 11.071C8.38 10.5698 8.89333 9.87469 9.34 9.15288C9.60667 8.71846 9.84 8.29073 10.0067 7.90309C10.1733 7.50209 10.2467 7.20134 10.2467 7.00752ZM6.74667 7.00752C6.74667 6.55973 6.98667 6.14536 7.37333 5.92481C7.76 5.70426 8.23333 5.70426 8.62667 5.92481C9.02 6.14536 9.25333 6.55973 9.25333 7.00752C9.25333 7.45531 9.01333 7.86967 8.62667 8.09023C8.24 8.31078 7.76667 8.31078 7.37333 8.09023C6.98 7.86967 6.74667 7.45531 6.74667 7.00752ZM8.49333 7.00752C8.49333 6.7335 8.26667 6.50627 7.99333 6.50627C7.72 6.50627 7.49333 6.7335 7.49333 7.00752C7.49333 7.28154 7.72 7.50877 7.99333 7.50877C8.26667 7.50877 8.49333 7.28154 8.49333 7.00752Z" fill="currentColor"/>
                        <path d="M3.14031 0H3.99491C4.30691 0 4.56465 0.257736 4.56465 0.569733C4.56465 0.881729 4.30691 1.13947 3.99491 1.13947H3.14031C2.03476 1.13947 1.13947 2.03476 1.13947 3.14031V3.99491C1.13947 4.30691 0.881729 4.56465 0.569733 4.56465C0.257736 4.56465 0 4.30691 0 3.99491V3.14031C0 1.40398 1.41077 0 3.14031 0ZM0.569733 5.71089C0.881729 5.71089 1.13947 5.96863 1.13947 6.28063V9.70581C1.13947 10.0178 0.881729 10.2755 0.569733 10.2755C0.257736 10.2755 0 10.0178 0 9.70581V6.28063C0 5.96863 0.257736 5.71089 0.569733 5.71089ZM1.14625 11.9983V12.8529C1.14625 13.9585 2.04154 14.8538 3.1471 14.8538H4.0017C4.31369 14.8538 4.57143 15.1115 4.57143 15.4235C4.57143 15.7355 4.31369 15.9932 4.0017 15.9932H3.1471C1.41077 15.9932 0.00678253 14.5892 0.00678253 12.8529V11.9983C0.00678253 11.6863 0.264519 11.4286 0.576515 11.4286C0.888512 11.4286 1.14625 11.6863 1.14625 11.9983ZM5.71768 0.569733C5.71768 0.257736 5.97541 0 6.28741 0H9.71937C10.0314 0 10.2891 0.257736 10.2891 0.569733C10.2891 0.881729 10.0314 1.13947 9.71937 1.13947H6.28741C5.97541 1.13947 5.71768 0.881729 5.71768 0.569733ZM6.28741 16C5.97541 16 5.71768 15.7423 5.71768 15.4303C5.71768 15.1183 5.97541 14.8605 6.28741 14.8605H9.71937C10.0314 14.8605 10.2891 15.1183 10.2891 15.4303C10.2891 15.7423 10.0314 16 9.71937 16H6.28741ZM15.4303 4.57143C15.1183 4.57143 14.8605 4.31369 14.8605 4.0017V3.1471C14.8605 2.04154 13.9652 1.14625 12.8597 1.14625H12.0051C11.6931 1.14625 11.4354 0.888512 11.4354 0.576515C11.4354 0.264519 11.6931 0.00678253 12.0051 0.00678253H12.8597C14.596 0.00678253 16 1.41077 16 3.1471V4.0017C16 4.31369 15.7423 4.57143 15.4303 4.57143ZM16 11.9983V12.8529C16 14.5892 14.5892 15.9932 12.8597 15.9932H12.0051C11.6931 15.9932 11.4354 15.7355 11.4354 15.4235C11.4354 15.1115 11.6931 14.8538 12.0051 14.8538H12.8597C13.9652 14.8538 14.8605 13.9585 14.8605 12.8529V11.9983C14.8605 11.6863 15.1183 11.4286 15.4303 11.4286C15.7423 11.4286 16 11.6863 16 11.9983ZM15.4303 5.71089C15.7423 5.71089 16 5.96863 16 6.28063V9.70581C16 10.0178 15.7423 10.2755 15.4303 10.2755C15.1183 10.2755 14.8605 10.0178 14.8605 9.70581V6.28063C14.8605 5.96863 15.1183 5.71089 15.4303 5.71089Z" fill="currentColor"/>
                      </svg>

                      {smallScreen &&
                        <span className="mobile-btn-text">Area</span>
                      }

                      {!smallScreen &&
                        <FontAwesomeIcon className="dropdown-icon" icon={faChevronDown} />
                      }
                    </Button>

                    {!smallScreen && showAreaFilters &&
                      <AreaFilter handleAreaFiltersClose={() => setShowAreaFilters(false)} objects={displayedCameras} />
                    }

                    <Button
                      variant="outline-primary"
                      className={'filter-option-btn highway-filter-btn' + (filterContext.highwayFilterKey ? ' filtered' : '') + (showHwyFilters ? ' active' : '')}
                      aria-label="show highway filters options"
                      onClick={() => setShowHwyFilters(!showHwyFilters)}>

                      {!smallScreen &&
                        <p className="btn-text">
                          {filterContext.highwayFilterKey ? getHighwayDisplay(filterContext.highwayFilterKey) : 'Highway'}
                        </p>
                      }

                      <svg className="highway-filter-btn__icon" width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.55965 1.74951V0.999722H10.6683V1.74951C10.6683 2.29936 11.0958 2.74924 11.6183 2.74924H15.4373L14.8673 3.91391C14.796 4.05387 14.7628 4.21383 14.7628 4.36879V13.0214C14.796 13.6212 14.5633 14.5959 13.675 15.4307C12.7916 16.2605 11.2098 16.9903 8.49287 16.9903C5.77591 16.9903 4.19894 16.2605 3.3107 15.4307C2.42246 14.5959 2.18972 13.6212 2.22297 13.0214V13.0064V12.9914V4.36879C2.22297 4.20883 2.18497 4.05387 2.11847 3.91391L1.55323 2.74924H5.60967C6.13216 2.74924 6.55965 2.29936 6.55965 1.74951ZM6.13216 0C5.84241 0 5.60967 0.244932 5.60967 0.549847V1.74951H0L0.356245 2.47931L1.27773 4.37379V12.9864C1.23498 13.8861 1.58173 15.1508 2.68371 16.1855C3.79519 17.2302 5.62392 18 8.49762 18C11.3713 18 13.2001 17.2302 14.3115 16.1855C15.4135 15.1508 15.7603 13.8861 15.7175 12.9864V4.36879L16.6438 2.47931L17 1.74951H11.6278V0.549847C11.6278 0.244932 11.3951 0 11.1053 0H6.14166H6.13216ZM6.00866 6.32824C6.36966 6.32824 6.68315 6.35324 6.95865 6.40322C7.23414 6.45321 7.46214 6.53319 7.64739 6.64815C7.83263 6.75812 7.97038 6.90808 8.06538 7.09303C8.16038 7.27798 8.20788 7.50292 8.20788 7.77784C8.20788 8.10275 8.13663 8.37767 7.99413 8.60261C7.85163 8.82755 7.64264 8.96251 7.37189 9.0125V9.05249C7.50964 9.08248 7.63314 9.12746 7.75189 9.18745C7.87063 9.24743 7.97038 9.32741 8.06063 9.42738C8.15088 9.52736 8.21738 9.65732 8.26963 9.81727C8.32188 9.97223 8.34563 10.1672 8.34563 10.3871C8.34563 10.642 8.29813 10.872 8.20313 11.0769C8.10813 11.2819 7.97513 11.4568 7.80413 11.6018C7.63314 11.7467 7.42414 11.8567 7.17714 11.9317C6.93015 12.0067 6.65465 12.0417 6.35066 12.0417H4.32244V6.33324H6.00866V6.32824ZM6.14166 8.58762C6.47415 8.58762 6.7069 8.53263 6.83515 8.42766C6.9634 8.32269 7.0299 8.15773 7.0299 7.9328C7.0299 7.70786 6.9539 7.5479 6.80665 7.45793C6.6594 7.36296 6.41716 7.31797 6.07991 7.31797H5.47192V8.58762H6.14166ZM5.47192 9.54735V11.0369H6.22241C6.56915 11.0369 6.80665 10.967 6.9444 10.827C7.08215 10.687 7.14864 10.4971 7.14864 10.2621C7.14864 10.0472 7.0774 9.87726 6.93965 9.74729C6.8019 9.61733 6.55015 9.55235 6.18441 9.55235H5.47192V9.54735ZM11.7323 7.25299C11.2906 7.25299 10.9533 7.42794 10.7206 7.77284C10.4878 8.11775 10.3691 8.59261 10.3691 9.19745C10.3691 9.80228 10.4783 10.2771 10.6921 10.6071C10.9058 10.942 11.2526 11.1069 11.7276 11.1069C11.9461 11.1069 12.1646 11.0819 12.3878 11.0269C12.6111 10.972 12.8533 10.897 13.1098 10.802V11.8167C12.8723 11.9167 12.6348 11.9917 12.4021 12.0417C12.1693 12.0916 11.9081 12.1116 11.6183 12.1116C11.0578 12.1116 10.5971 11.9917 10.2361 11.7467C9.8751 11.5018 9.60911 11.1619 9.43811 10.722C9.26711 10.2821 9.18161 9.76729 9.18161 9.18245C9.18161 8.59761 9.28136 8.09775 9.47611 7.65287C9.67561 7.208 9.9606 6.86309 10.3406 6.61316C10.7158 6.36323 11.1813 6.23827 11.7276 6.23827C11.9936 6.23827 12.2643 6.27326 12.5351 6.34824C12.8058 6.41822 13.0671 6.51819 13.3141 6.63816L12.9436 7.62288C12.7393 7.52291 12.5351 7.43294 12.3308 7.35796C12.1266 7.28298 11.9223 7.24799 11.7276 7.24799L11.7323 7.25299Z" fill="currentColor" />
                      </svg>

                      {smallScreen &&
                        <span className="mobile-btn-text">Highway</span>
                      }

                      {!smallScreen &&
                        <FontAwesomeIcon className="dropdown-icon" icon={faChevronDown} />
                      }
                    </Button>

                    {!smallScreen && showHwyFilters &&
                      <HighwayFilter cameras={displayedCameras} handleHwyFiltersClose={() => setShowHwyFilters(false)} />
                    }
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
                      defaultInputValue={searchText}
                    >
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

              {smallScreen && (filterContext.highwayFilterKey || filterContext.areaFilter) &&
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

      {smallScreen &&
        <div className={`overlay filters-overlay ${showAreaFilters ? 'open' : ''}`}>
          <button
            className="close-overlay"
            aria-label={`${showAreaFilters ? 'close overlay' : ''}`}
            aria-labelledby="button-close-overlay"
            aria-hidden={`${showAreaFilters ? false : true}`}
            tabIndex={`${showAreaFilters ? 0 : -1}`}
            onClick={() => setShowAreaFilters(false)}>

            <FontAwesomeIcon icon={faXmark} />
          </button>

          <p className="overlay__header bold">Filter by area</p>
          <AreaFilter handleAreaFiltersClose={() => setShowAreaFilters(false)} objects={displayedCameras} />
        </div>
      }

      {smallScreen &&
        <div className={`overlay filters-overlay ${showHwyFilters ? 'open' : ''}`}>
          <button
            className="close-overlay"
            aria-label={`${showHwyFilters ? 'close overlay' : ''}`}
            aria-labelledby="button-close-overlay"
            aria-hidden={`${showHwyFilters ? false : true}`}
            tabIndex={`${showHwyFilters ? 0 : -1}`}
            onClick={() => setShowHwyFilters(false)}>

            <FontAwesomeIcon icon={faXmark} />
          </button>

          <p className="overlay__header bold">Filter by highway</p>
          <HighwayFilter cameras={displayedCameras} handleHwyFiltersClose={() => setShowHwyFilters(false)} />
        </div>
      }

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
