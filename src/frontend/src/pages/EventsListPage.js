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
  faLayerGroup as faLayerGroupOutline
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
import ListFilters from '../Components/shared/ListFilters';
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
  // const { headerHeightContext } = useContext(HeaderHeightContext);

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
  const [showTypeFilters, setShowTypeFilters] = useState(false);

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
        display_category: event.display_category,
        zoom: 11,
        pan: event.location.coordinates[0] + ',' + event.location.coordinates[1],
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
            <div className="sticky-sentinel" />
            <div className="sticky-filters">
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

                    {smallScreen &&
                      <Button
                        variant="outline-primary"
                        className={'map-btn open-filters filter-option-btn'  + (showTypeFilters ? ' active' : '')}
                        aria-label="open filters options"
                        onClick={() => setShowTypeFilters(!showTypeFilters)}>
                        <FontAwesomeIcon icon={faLayerGroupOutline} />
                        <span className="mobile-btn-text">Type</span>
                      </Button>
                    }

                    {!smallScreen &&
                      <div className="type filter-option-btn">
                        <ListFilters
                          disableFeatures={true}
                          enableRoadConditions={false}
                          enableChainUps={true}
                          textOverride={'List'}
                          iconOverride={true}
                          isDelaysPage={true} />
                      </div>
                    }

                    {!smallScreen && showAreaFilters &&
                      <AreaFilter handleAreaFiltersClose={() => setShowAreaFilters(false)} objects={processedEvents} showAllByDefault={true} />
                    }
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
                      onKeyDown={() => setFilterContext({...filterContext, areaFilter: null})}>
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

                  <strong>Have you applied filters (e.g. an area or a highway) to narrow down the list?</strong>
                  <p>These filters also narrow down the delays on this page.</p>
                  <ul>
                    <li>Remove or adjust the area or highway filters to reveal more delays if they are in effect.</li>
                  </ul>

                  <strong>Have you hidden any of the layers using the list filter?</strong>
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
          <AreaFilter handleAreaFiltersClose={() => setShowAreaFilters(false)} objects={processedEvents} showAllByDefault={true} />
        </div>
      }

      {smallScreen &&
        <div className={`overlay filters-overlay ${showTypeFilters ? 'open' : ''}`}>
          <button
            className="close-overlay"
            aria-label={`${showTypeFilters ? 'close overlay' : ''}`}
            aria-labelledby="button-close-overlay"
            aria-hidden={`${showTypeFilters ? false : true}`}
            tabIndex={`${showTypeFilters ? 0 : -1}`}
            onClick={() => setShowTypeFilters(false)}>

            <FontAwesomeIcon icon={faXmark} />
          </button>

          <p className="overlay__header bold">List</p>

          <ListFilters
            disableFeatures={true}
            enableRoadConditions={false}
            enableChainUps={true}
            textOverride={'List'}
            iconOverride={true}
            isDelaysPage={true}
            fullOverlay={true} />
        </div>
      }

      {smallScreen && (filteredAdvisories && filteredAdvisories.length > 0) &&
        <div className={`overlay advisories-overlay popup--advisories ${openAdvisoriesOverlay ? 'open' : ''}`}>
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
