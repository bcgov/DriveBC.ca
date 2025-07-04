// React
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';

// Routing
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { updateAdvisories } from '../slices/cmsSlice';
import * as slices from '../slices';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAngleDown,
  faXmark,
  faFlag,
  faChevronDown
} from '@fortawesome/pro-solid-svg-icons';
import {
  faArrowUp,
  faArrowDown,
  faBarsSort,
} from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

// Internal imports
import { CMSContext, MapContext, HeaderHeightContext, FilterContext } from '../App';
import { filterAdvisoryByRoute } from "../Components/map/helpers";
import { getAdvisories, markAdvisoriesAsRead } from '../Components/data/advisories';
import { getEvents, getEventDetails } from '../Components/data/events';
import { defaultSortFn, routeAtSortFn, routeOrderSortFn, severitySortFn } from '../Components/events/functions';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Advisories from '../Components/advisories/Advisories';
import EventCard from '../Components/events/EventCard';
import EventsTable from '../Components/events/EventsTable';
import Filters from '../Components/shared/Filters';
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';
import PollingComponent from '../Components/shared/PollingComponent';
import RouteSearch from '../Components/routing/RouteSearch';
import trackEvent from '../Components/shared/TrackEvent.js';
import AdvisoriesPanel from '../Components/map/panels/AdvisoriesPanel';

// Styling
import './EventsListPage.scss';
import './ContainerSidePanel.scss';
import AreaFilter from "../Components/shared/AreaFilter";

// Helpers
const sortEvents = (events, key) => {
  // Sort by selected option
  switch (key) {
    case 'route_order':
        events.sort((a, b) => routeOrderSortFn(a, b));
        break;
    case 'severity_desc':
    case 'severity_asc':
        events.sort((a, b) =>
          key.endsWith('_asc') ? severitySortFn(a, b) : severitySortFn(a, b) * -1
        );
        break;
    case 'road_name_desc':
    case 'road_name_asc':
        events.sort((a, b) =>
          key.endsWith('_asc') ? routeAtSortFn(a, b) : routeAtSortFn(a, b) * -1
        );
        break;
    case 'last_updated_desc':
    case 'last_updated_asc':
        events.sort((a, b) =>
          key.endsWith('_asc') ? defaultSortFn(a, b, 'last_updated') : defaultSortFn(a, b, 'last_updated') * -1
        );
        break;
  }
}

export default function EventsListPage() {
  /* Setup */
  document.title = 'DriveBC - Delays';

  // Navigation
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redux
  const dispatch = useDispatch();
  const { advisories, filteredAdvisories, events, filteredEvents, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    filteredAdvisories: state.cms.advisories.filteredList,
    events: state.feeds.events.list,
    filteredEvents: state.feeds.events.filteredList,
    selectedRoute: state.routes.selectedRoute
  }))));

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);
  const { filterContext, setFilterContext } = useContext(FilterContext);
  const { mapContext } = useContext(MapContext);
  const { headerHeightContext } = useContext(HeaderHeightContext);

  // States
  const getFilterState = () => {
    if (searchParams.get('chainUpsOnly') === 'true') {
      return {
        'closures': false,
        'majorEvents': false,
        'minorEvents': false,
        'futureEvents': false,
        'chainUps': true
      };
    }

    return {
      'closures': mapContext.visible_layers.closures,
      'majorEvents': mapContext.visible_layers.majorEvents,
      'minorEvents': mapContext.visible_layers.minorEvents,
      'futureEvents': mapContext.visible_layers.futureEvents,
      'chainUps': mapContext.visible_layers.chainUps
    };
  }

  const [sortingKey, setSortingKey] = useState(selectedRoute && selectedRoute.routeFound ? 'route_order' : (localStorage.getItem('sorting-key')? localStorage.getItem('sorting-key') : 'severity_desc'));
  const [eventCategoryFilter, setEventCategoryFilter] = useState(getFilterState());
  const [processedEvents, setProcessedEvents] = useState([]); // Nulls for mapping loader
  const [trackedEvents, setTrackedEvents] = useState({}); // Track event updates between refreshes
  const [showLoader, setShowLoader] = useState(true);
  const [loadData, setLoadData] = useState(true);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [openAdvisoriesOverlay, setOpenAdvisoriesOverlay] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [updateCounts, setUpdateCounts] = useState({above: 0, below: 0});
  const [showAreaFilters, setShowAreaFilters] = useState(false);

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  // Refs
  const isInitialMount = useRef(true);
  const isInitialLoad = useRef(true);
  const isInitialAdvisoryLoad = useRef(true);
  const workerRef = useRef();
  const eventRefs = useRef({});
  const viewedHighlightedEvents = useRef(new Set());
  const eventsInViewport = useRef({});

  // Media queries
  const smallScreen = useMediaQuery('only screen and (max-width : 575px)');
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Data functions
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

  const loadEventDetail = async (event_id) => {
    return await getEventDetails(event_id).catch((error) => displayError(error));
  }

  const loadEvents = async route => {
    // Fetch data
    const eventData = await getEvents(!isInitialLoad.current).catch((error) => displayError(error));

    // Track unfiltered events' highlight status and last_updated timestamp
    const trackedEventsDict = eventData.reduce((acc, event) => {
      const trackedEvent = trackedEvents[event.id] ?? null;

      if (trackedEvent) {
        event.location = trackedEvent.location;
        event.polygon = trackedEvent.polygon;
      }

      acc[event.id] = {
        location: event.location,
        polygon: event.polygon,
        highlight: trackedEvent ? event.last_updated !== trackedEvent.last_updated || trackedEvent.highlight : !isInitialLoad.current,
        last_updated: event.last_updated
      };
      return acc;
    }, {});

    // Remove items that no longer exist
    Object.keys(trackedEvents).forEach((key) => {
      if (!trackedEventsDict[key]) {
        delete trackedEvents[key];
      }
    });

    // Fetch locations for events that were newly added from polling calls
    for (const event of eventData) {
      if (!event.location) {
        const eventDetails = await loadEventDetail(event.id);
        event.location = eventDetails.location;
        trackedEventsDict[event.id].location = eventDetails.location;

        event.polygon = eventDetails.polygon;
        trackedEventsDict[event.id].polygon = eventDetails.polygon;
      }
    }

    setTrackedEvents(trackedEventsDict);

    if (isInitialLoad.current)
      isInitialLoad.current = false;

    workerRef.current.postMessage({ data: eventData, route: (route && route.routeFound ? route : null), action: 'updateEvents' });
  }

  const processEvents = () => {
    const hasTrue = (val) => !!val;
    const hasFilterOn = Object.values(eventCategoryFilter).some(hasTrue);

    let res = [...filteredEvents];

    // Layer Filter
    if (hasFilterOn) {
      res = res.filter((e) => !!eventCategoryFilter[e.display_category]);

    } else {
      res = res.filter((e) => e.display_category !== 'roadConditions');
    }

    // Area Filter
    if (filterContext.areaFilter) {
      res = res.filter((e) => {
        if (!e.area) return false; // Skip events without area data
        return e.area.includes(filterContext.areaFilter.id);
      });
    }

    // Reset sorting key and sort
    if (selectedRoute && selectedRoute.routeFound) {
      setSortingKey('route_order');
      sortEvents(res, 'route_order');

    } else {
      if (localStorage.getItem('sorting-key')){
        setSortingKey(localStorage.getItem('sorting-key'));
        sortEvents(res, localStorage.getItem('sorting-key'));
      }
      else {
        setSortingKey('severity_desc');
        sortEvents(res, 'severity_desc');
      }
    }

    setProcessedEvents(res);
    loadAdvisories();
  };

  // Scroll/Context functions
  const getScrollPosition = () => {

    // Do nothing if the page is at the top
    if (window.scrollY === 0) return

    // Get the current positions of all elements previously in the viewport, using the top position as the key
    Object.keys(eventsInViewport.current).forEach((eventId) => {
      const element = document.querySelector(`[data-key="${eventId}"]`);

      if (element) {
        eventsInViewport.current[eventId] = Math.floor(element.getBoundingClientRect().top);
      }
    });
  };

  const scrollToMaintainContext = () => {
    // Get the elements and sort them by offsetFromTop
    const sortedElements = Object.entries(eventsInViewport.current)
      .sort(([, a], [, b]) => a - b)
      .map(([key]) => key);

    // Loop through the sorted keys and scroll to the first item that exists
    for (const key of sortedElements) {
      const element = document.querySelector(`[data-key="${key}"]`);
      const offsetFromTop = eventsInViewport.current[key];

      if (element && offsetFromTop) {
        const newTop = document.querySelector(`[data-key="${key}"]`).getBoundingClientRect().top + window.scrollY - offsetFromTop;
        window.scrollTo({ top: newTop, behavior: 'instant' });
        break;
      }
    }
  }

  // useEffect hooks
  useEffect(() => {
    // Create a new worker if it doesn't exist
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../Components/map/filterRouteWorker.js', import.meta.url));

      // Set up event listener for messages from the worker
      workerRef.current.onmessage = function (event) {
        const { data, filteredData, action } = event.data;

        // compare new and existing data here and tag them
        dispatch(
          slices[action]({
            list: data,
            filteredList: filteredData,
            timeStamp: new Date().getTime()
          })
        );

        setLoadData(false);
      };
    }

    // Cleanup function to terminate the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    setShowLoader(true);
    setLoadData(true);

  }, [selectedRoute]);

  useEffect(() => {
    if (events) {
      getScrollPosition(); // Get the current scroll position before updating the data
      processEvents();
      setLoadData(false);
    }
  }, [filteredEvents, eventCategoryFilter, filterContext.areaFilter]);

  useEffect(() => {
    if (loadData) {
      loadEvents(selectedRoute);
    } else {
      setShowLoader(false);
    }
  }, [loadData]);

  useEffect(() => {
    // Do nothing on initial run
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    sortEvents(processedEvents, sortingKey);
    setProcessedEvents(processedEvents);

  }, [sortingKey]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const eventId = entry.target.getAttribute('data-key');
          const isHighlighted = trackedEvents[eventId]?.highlight;

          if (entry.isIntersecting) {
            // Add element to the set when it intersects
            eventsInViewport.current[eventId] = null;

            // Set viewedHighlightedEvents to true when the highlighted event is scrolled into the viewport
            if (isHighlighted && !viewedHighlightedEvents.current.has(eventId)) {
              viewedHighlightedEvents.current.add(eventId);
            }
          } else {
            // Remove element from the set when it no longer intersects
            delete eventsInViewport.current[eventId];

            // Set highlight to false when the event has been in the viewport and is scrolled out of the viewport
            if (isHighlighted && viewedHighlightedEvents.current.has(eventId)) {
              viewedHighlightedEvents.current.delete(eventId);
              updateHighlightHandler({ id: eventId, highlight: false }); // Update the data in the parent so it can be used by the webworker
            }
          }
        })

        // Count items with highlight outside current viewport
        const counts = { above: 0, below: 0 }

        Object.entries(eventRefs.current).forEach(([eventId, ref]) => {
          const isHighlighted = trackedEvents[eventId]?.highlight;
          if (!ref || !isHighlighted || viewedHighlightedEvents.current.has(eventId)) return;

          const elementTop = ref.getBoundingClientRect().top;

          if (elementTop < window.innerHeight) {
            counts.above++;
          } else {
            counts.below++;
          }
        });

        setUpdateCounts(counts);
      },
      {
        rootMargin: "-58px 0px 0px 0px", // Factor in the height of the header
        threshold: 1 // Trigger when the entire header element is in the viewport
      }
    );

    setTimeout(() => {
      scrollToMaintainContext() // Scroll to maintain context after the page has rendered

      // Observe all elements
      Object.values(eventRefs.current).forEach((ref) => {
        if (ref) {
          observer.observe(ref);
        }
      });
    }, 0);

    return () => {
      observer.disconnect();
    };
  }, [processedEvents, trackedEvents]);

  // Handlers

  useEffect(() => {
    setEventCategoryFilter(getFilterState());
  }, [mapContext]);

  const handleRoute = (event) => {
    trackEvent('click', 'event', 'events list page', event.event_type, event.event_sub_type);

    navigate({
      pathname: '/',
      search: `?${createSearchParams({
        type: "event",
        id: event.id,
        display_category: event.display_category
      })}`
    });
  };

  const sortHandler = (e, key) => {
    e.preventDefault();
    if (sortingKey != key) {
      setSortingKey(key);
      localStorage.setItem('sorting-key', key);
    }
  }

  const updateHighlightHandler = (updatedEvent) => {
    setTrackedEvents((trackedEvents) => {
      const newTrackedEvents = {
        ...trackedEvents,
        [updatedEvent.id]: {
          ...trackedEvents[updatedEvent.id],
          highlight: updatedEvent.highlight
        }
      };

      return newTrackedEvents;
    });
  }

  const scrollToNextHighlightedEventHandler = (direction) => {
    const offset = 58 + 48; // Offset Y position by 58px to account for the header + 48px of padding

    // Get all highlighted events that are not in the viewport and sort them by their position
    const sortedRefs = Object.entries(eventRefs.current)
      .filter(([key, ref]) => trackedEvents[key]?.highlight && !viewedHighlightedEvents.current.has(key))
      .map(([key, ref]) => ({
        key,
        top: Math.floor(ref.getBoundingClientRect().top + window.scrollY - offset)
      }))
      .sort((a, b) => a.top - b.top);

    const currentScrollPosition = Math.floor(window.scrollY);
    let nextElementTopPosition;

    if (direction === 'above') {
      nextElementTopPosition = sortedRefs.reverse().find(ref => ref.top < currentScrollPosition)?.top;
    } else if (direction === 'below') {
      nextElementTopPosition = sortedRefs.find(ref => ref.top > currentScrollPosition)?.top;
    }

    if (nextElementTopPosition !== undefined) {
      window.scrollTo({ top: nextElementTopPosition, behavior: 'smooth' });
    }
  };

  // Rendering - Sorting
  const getSortingDisplay = (key) => {
    const sortingDisplayMap = {
      'route_order': 'In order encountered on route',
      'severity_desc': 'Severity, Closure to Minor',
      'severity_asc': 'Severity, Minor to Closure',
      'road_name_asc': 'Road name, A–Z',
      'road_name_desc': 'Road name, Z-A',
      'last_updated_desc': 'Last updated, New to Old',
      'last_updated_asc': 'Last updated, Old to New',
    }

    return sortingDisplayMap[key];
  }

  const allSortingKeys = ['route_order', 'severity_desc', 'severity_asc', 'road_name_asc', 'road_name_desc', 'last_updated_desc', 'last_updated_asc'];
  const getSortingList = () => {
    const res = [];

    // Don't show first label if route is not selected or found
    for (let i = selectedRoute && selectedRoute.routeFound ? 0 : 1; i < allSortingKeys.length; i++) {
      res.push(
        <Dropdown.Item key={allSortingKeys[i]} className={allSortingKeys[i] == sortingKey ? 'selected' : ''} onClick={(e) => sortHandler(e, allSortingKeys[i])}>
          {getSortingDisplay(allSortingKeys[i])}
        </Dropdown.Item>
      );
    }

    return res;
  }

  // Handle sticky filters on mobile
  useEffect(() => {
    const element = document.querySelector('.sticky-filters');
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      // If the element's top is less than or equal to headerHeight, it's stuck
      const stuck = rect.top <= headerHeightContext;
      element.toggleAttribute('stuck', stuck);
    };

    // window.addEventListener('scroll', handleScroll);
    // // Initial check
    // handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headerHeightContext]);

  // Rendering - Main component
  return (
    <React.Fragment>
      <div className="events-page">
        {showNetworkError &&
          <NetworkErrorPopup />
        }

        {!showNetworkError && showServerError &&
          <ServerErrorPopup setShowServerError={setShowServerError} />
        }

        <PageHeader
          title="Delays"
          description="Find out if there are any delays that might impact your journey before you go.">
        </PageHeader>

        <Container className="container--sidepanel">
          { !smallScreen &&
            <div className="container--sidepanel__left">
              <RouteSearch showFilterText={true} showSpinner={showSpinner} onShowSpinnerChange={setShowSpinner}/>
              <Advisories advisories={filteredAdvisories} selectedRoute={selectedRoute} />
            </div>
          }

          <div className="container--sidepanel__right">
            <div className="sticky-filters" style={{ top: `${headerHeightContext}px` }}>
              <div className="controls-group">
                <div className="controls-container">
                  <div className="sort">
                    <Dropdown>
                      {!smallScreen && <span className="sort-text">Sort: </span>}
                      <Dropdown.Toggle variant="outline-primary" disabled={selectedRoute && selectedRoute.routeFound} className={smallScreen ? 'filter-option-btn' : ''}>
                        {!smallScreen ?
                          <React.Fragment>
                            {getSortingDisplay(sortingKey)}
                            <FontAwesomeIcon icon={faAngleDown} />
                          </React.Fragment>
                          :
                          <React.Fragment>
                            <span className="sr-only" aria-hidden="false">Sorting options</span>
                            <FontAwesomeIcon icon={faBarsSort} />
                            <span className="mobile-btn-text">Sort</span>
                          </React.Fragment>}
                      </Dropdown.Toggle>

                      <Dropdown.Menu align="end" flip={false}>
                        {getSortingList()}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  <div className="tools-container">
                    <span className="filters-text">Filters{!smallScreen && ':'} </span>

                    <div className="type filter-option-btn">
                      <Button
                        variant="outline-primary"
                        className={'filter-option-btn area-filter-btn' + (filterContext.areaFilter ? ' filtered' : '') + (showAreaFilters ? ' active' : '')}
                        aria-label="show filters options"
                        onClick={() => setShowAreaFilters(!showAreaFilters)}>

                        {!smallScreen &&
                          <p className="btn-text">
                            {filterContext.areaFilter ? filterContext.areaFilter.name : 'Area'}
                          </p>
                        }
                        <svg className="area-filter-btn__icon" width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.55965 1.74951V0.999722H10.6683V1.74951C10.6683 2.29936 11.0958 2.74924 11.6183 2.74924H15.4373L14.8673 3.91391C14.796 4.05387 14.7628 4.21383 14.7628 4.36879V13.0214C14.796 13.6212 14.5633 14.5959 13.675 15.4307C12.7916 16.2605 11.2098 16.9903 8.49287 16.9903C5.77591 16.9903 4.19894 16.2605 3.3107 15.4307C2.42246 14.5959 2.18972 13.6212 2.22297 13.0214V13.0064V12.9914V4.36879C2.22297 4.20883 2.18497 4.05387 2.11847 3.91391L1.55323 2.74924H5.60967C6.13216 2.74924 6.55965 2.29936 6.55965 1.74951ZM6.13216 0C5.84241 0 5.60967 0.244932 5.60967 0.549847V1.74951H0L0.356245 2.47931L1.27773 4.37379V12.9864C1.23498 13.8861 1.58173 15.1508 2.68371 16.1855C3.79519 17.2302 5.62392 18 8.49762 18C11.3713 18 13.2001 17.2302 14.3115 16.1855C15.4135 15.1508 15.7603 13.8861 15.7175 12.9864V4.36879L16.6438 2.47931L17 1.74951H11.6278V0.549847C11.6278 0.244932 11.3951 0 11.1053 0H6.14166H6.13216ZM6.00866 6.32824C6.36966 6.32824 6.68315 6.35324 6.95865 6.40322C7.23414 6.45321 7.46214 6.53319 7.64739 6.64815C7.83263 6.75812 7.97038 6.90808 8.06538 7.09303C8.16038 7.27798 8.20788 7.50292 8.20788 7.77784C8.20788 8.10275 8.13663 8.37767 7.99413 8.60261C7.85163 8.82755 7.64264 8.96251 7.37189 9.0125V9.05249C7.50964 9.08248 7.63314 9.12746 7.75189 9.18745C7.87063 9.24743 7.97038 9.32741 8.06063 9.42738C8.15088 9.52736 8.21738 9.65732 8.26963 9.81727C8.32188 9.97223 8.34563 10.1672 8.34563 10.3871C8.34563 10.642 8.29813 10.872 8.20313 11.0769C8.10813 11.2819 7.97513 11.4568 7.80413 11.6018C7.63314 11.7467 7.42414 11.8567 7.17714 11.9317C6.93015 12.0067 6.65465 12.0417 6.35066 12.0417H4.32244V6.33324H6.00866V6.32824ZM6.14166 8.58762C6.47415 8.58762 6.7069 8.53263 6.83515 8.42766C6.9634 8.32269 7.0299 8.15773 7.0299 7.9328C7.0299 7.70786 6.9539 7.5479 6.80665 7.45793C6.6594 7.36296 6.41716 7.31797 6.07991 7.31797H5.47192V8.58762H6.14166ZM5.47192 9.54735V11.0369H6.22241C6.56915 11.0369 6.80665 10.967 6.9444 10.827C7.08215 10.687 7.14864 10.4971 7.14864 10.2621C7.14864 10.0472 7.0774 9.87726 6.93965 9.74729C6.8019 9.61733 6.55015 9.55235 6.18441 9.55235H5.47192V9.54735ZM11.7323 7.25299C11.2906 7.25299 10.9533 7.42794 10.7206 7.77284C10.4878 8.11775 10.3691 8.59261 10.3691 9.19745C10.3691 9.80228 10.4783 10.2771 10.6921 10.6071C10.9058 10.942 11.2526 11.1069 11.7276 11.1069C11.9461 11.1069 12.1646 11.0819 12.3878 11.0269C12.6111 10.972 12.8533 10.897 13.1098 10.802V11.8167C12.8723 11.9167 12.6348 11.9917 12.4021 12.0417C12.1693 12.0916 11.9081 12.1116 11.6183 12.1116C11.0578 12.1116 10.5971 11.9917 10.2361 11.7467C9.8751 11.5018 9.60911 11.1619 9.43811 10.722C9.26711 10.2821 9.18161 9.76729 9.18161 9.18245C9.18161 8.59761 9.28136 8.09775 9.47611 7.65287C9.67561 7.208 9.9606 6.86309 10.3406 6.61316C10.7158 6.36323 11.1813 6.23827 11.7276 6.23827C11.9936 6.23827 12.2643 6.27326 12.5351 6.34824C12.8058 6.41822 13.0671 6.51819 13.3141 6.63816L12.9436 7.62288C12.7393 7.52291 12.5351 7.43294 12.3308 7.35796C12.1266 7.28298 11.9223 7.24799 11.7276 7.24799L11.7323 7.25299Z" fill="currentColor" />
                        </svg>
                        {smallScreen &&
                          <span className="mobile-btn-text">Area</span>
                        }
                        {!smallScreen &&
                          <FontAwesomeIcon className="dropdown-icon" icon={faChevronDown} />
                        }
                      </Button>

                      {!smallScreen && showAreaFilters &&
                        <AreaFilter handleAreaFiltersClose={() => setShowAreaFilters(false)} />
                      }
                    </div>

                    <div className="type filter-option-btn">
                      <Filters
                        disableFeatures={true}
                        enableRoadConditions={false}
                        enableChainUps={true}
                        textOverride={'List'}
                        iconOverride={true}
                        isDelaysPage={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {smallScreen && filterContext.areaFilter &&
                <div className="selected-filters-container">
                  <div className="selected-filter">
                    <div className="selected-filter-text">
                      {filterContext.areaFilter ? filterContext.areaFilter.name : 'Highway'}
                    </div>
                    <div
                      className="remove-btn"
                      tabIndex={0}
                      onClick={() => setFilterContext({...filterContext, areaFilter: null})}
                      onKeyPress={() => setFilterContext({...filterContext, areaFilter: null})}>
                      <FontAwesomeIcon icon={faXmark} />
                    </div>
                  </div>
                </div>
              }
            </div>

            {smallScreen && (filteredAdvisories && filteredAdvisories.length > 0) &&
              <Button
                className={'advisories-btn'}
                aria-label="open advisories list"
                onClick={() => setOpenAdvisoriesOverlay(true)}>
                <span className="advisories-title">
                  <FontAwesomeIcon icon={faFlag} />
                  Route advisories
                </span>
                <span className="advisories-count">{filteredAdvisories.length}</span>
              </Button>
            }

            <PollingComponent runnable={() => setLoadData(true)} interval={30000} />

            <div className="events-list-table">
              { largeScreen && !!processedEvents.length &&
                <EventsTable
                  data={processedEvents}
                  routeHandler={handleRoute}
                  showLoader={showLoader}
                  sortingKey={sortingKey}
                  eventRefs={eventRefs}
                  trackedEvents={trackedEvents}
                />
              }

              { !largeScreen &&
                <div className="events-list">
                  { !showLoader && processedEvents.map(
                    (e) => (
                      <EventCard
                        childRef={(el) => (eventRefs.current[e.id] = el)}
                        key={e.id}
                        event={e}
                        handleRoute={handleRoute}
                        trackedEvents={trackedEvents}
                      />
                    ),
                  )}

                  { showLoader && new Array(5).fill('').map(
                    (_, index) => (
                      <div className="card-selector" key={`loader-${index}`}>
                        <EventCard
                          className="event"
                          showLoader={true}
                        />
                      </div>
                    ),
                  )}
                </div>
              }

              {(!showLoader && !processedEvents.length) &&
                <div className="empty-event-display">
                  <h2>No delays to display</h2>

                  <strong>Do you have a starting location and a destination entered?</strong>
                  <p>Adding a route will narrow down the information for the whole site, including the delays list. There might not be any delays between those two locations.</p>

                  <strong>Have you hidden any of the layers using the filters?</strong>
                  <p>Try toggling the filters on and off so that more information can be displayed.</p>
                </div>
              }
            </div>

          {updateCounts.above > 0 && <button className="update-count-pill top" onClick={() => scrollToNextHighlightedEventHandler('above')}><FontAwesomeIcon icon={faArrowUp} /> {updateCounts.above} update{updateCounts.above !== 1 ? 's' : ''} available</button>}
          {updateCounts.below > 0 && <button className="update-count-pill bottom" onClick={() => scrollToNextHighlightedEventHandler('below')}><FontAwesomeIcon icon={faArrowDown} /> {updateCounts.below} update{updateCounts.below !== 1 ? 's' : ''} available</button>}

          </div>
        </Container>
        <Footer />
      </div>

      {smallScreen &&
        <div className={`overlay filters-overlay ${showAreaFilters ? 'open' : ''}`}
          style={showAreaFilters ? { minHeight: `calc(100% - ${headerHeightContext}px)`} : null}>
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
          <AreaFilter handleAreaFiltersClose={() => setShowAreaFilters(false)} />
        </div>
      }

      {smallScreen && (filteredAdvisories && filteredAdvisories.length > 0) &&
        <div className={`overlay advisories-overlay popup--advisories ${openAdvisoriesOverlay ? 'open' : ''}`}
             style={openAdvisoriesOverlay ? {minHeight: `calc(100% - ${headerHeightContext}px)`} : null}>
          <button
            className="close-panel close-overlay"
            aria-label={`${openAdvisoriesOverlay ? 'close overlay' : ''}`}
            aria-hidden={`${openAdvisoriesOverlay ? false : true}`}
            tabIndex={`${openAdvisoriesOverlay ? 0 : -1}`}
            onClick={() => {if (openAdvisoriesOverlay) setOpenAdvisoriesOverlay(false)}}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <AdvisoriesPanel advisories={advisories} openAdvisoriesOverlay={openAdvisoriesOverlay} />
        </div>
      }
    </React.Fragment>
  );
}
