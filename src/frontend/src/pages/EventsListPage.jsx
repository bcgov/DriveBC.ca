// React
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';

// Routing
import { createSearchParams, useNavigate } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { updateAdvisories } from '../slices/cmsSlice';
import * as slices from '../slices';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faFlag,
  faSliders
} from '@fortawesome/pro-solid-svg-icons';
import {
  faArrowUp,
  faArrowDown,
  faLayerGroup as faLayerGroupOutline
} from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';

// Internal imports
import { CMSContext, MapContext, FilterContext } from '../App';
import { filterAdvisoryByRoute } from "../Components/map/helpers";
import { getAdvisories, markAdvisoriesAsRead } from '../Components/data/advisories';
import { getEvents, getEventDetails } from '../Components/data/events';
import { defaultSortFn, routeAtSortFn, routeOrderSortFn, severitySortFn } from '../Components/events/functions';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Advisories from '../Components/advisories/Advisories';
import EventCard from '../Components/events/EventCard';
import EventListSearch, { filterEventsBySearch } from '../Components/events/EventListSearch';
import EventsTable from '../Components/events/EventsTable';
import ListFilters from '../Components/shared/ListFilters';
import Footer from '../Footer';
import PageHeader from '../PageHeader';
import PollingComponent from '../Components/shared/PollingComponent';
import RouteSearch from '../Components/routing/RouteSearch';
import trackEvent from '../Components/shared/TrackEvent';
import AdvisoriesPanel from '../Components/map/panels/AdvisoriesPanel';
import FiltersOverlay from '../Components/shared/FiltersOverlay';

// Styling
import './EventsListPage.scss';
import './ContainerSidePanel.scss';

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

export default function EventsListPage(props) {
  /* Setup */
  // Props
  const { chainUpsOnly } = props;

  document.title = chainUpsOnly ? 'DriveBC - Chain-ups' : 'DriveBC - Delays';

  // Navigation
  const navigate = useNavigate();

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

  // States
  const getFilterState = () => {
    if (chainUpsOnly) {
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

  const getDefaultSortingKey = () => {
    if (selectedRoute && selectedRoute.routeFound) {
      return 'route_order';
    }

    if (chainUpsOnly) {
      return 'road_name_asc';
    }

    if (localStorage.getItem('sorting-key')) {
      return localStorage.getItem('sorting-key');
    }

    return 'severity_desc';
  }
  const [sortingKey, setSortingKey] = useState(getDefaultSortingKey());
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
  const [showFilters, setShowFilters] = useState(false);
  const [showTypeFilters, setShowTypeFilters] = useState(false);
  const [searchText, setSearchText] = useState('');

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

    // Text search — road name, start/end location, closest landmark, description
    res = filterEventsBySearch(res, searchText);

    // Reset sorting key and sort
    setSortingKey(getDefaultSortingKey());
    if (selectedRoute && selectedRoute.routeFound) {
      sortEvents(res, 'route_order');

    } else {
      if (chainUpsOnly) {
        sortEvents(res, 'road_name_asc');

      } else if (localStorage.getItem('sorting-key')){
        sortEvents(res, localStorage.getItem('sorting-key'));

      } else {
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

        const scrollableContainer = document.querySelector('#main');
        scrollableContainer.scrollTo({ top: newTop, behavior: 'instant' });
        break;
      }
    }
  }

  // useEffect hooks
  useEffect(() => {
    // Create a new worker if it doesn't exist
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../Components/map/filterRouteWorker', import.meta.url),
        { type: 'module' }
      );

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
  }, [filteredEvents, eventCategoryFilter, filterContext.areaFilter, searchText]);

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

  useEffect(() => {
    setEventCategoryFilter(getFilterState());
  }, [mapContext]);

  // Handlers
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

  const toggleFiltersOverlay = () => {
    setShowFilters(!showFilters);
  };

  // Reset applied filters (pills)
  const resetAllAppliedFilters = () => {
    setFilterContext({
      ...filterContext,
      areaFilter: null
    });

    const defaultKey = getDefaultSortingKey();
    setSortingKey(defaultKey);
    localStorage.setItem('sorting-key', defaultKey);
  };

  const handleSortingKeyChange = (key) => {
    setSortingKey(key);
    localStorage.setItem('sorting-key', key);
  };

  const activeFilterCount = filterContext.areaFilter ? 1 : 0;

  const sortingKeys = chainUpsOnly
    ? ['route_order', 'road_name_asc', 'road_name_desc', 'last_updated_desc', 'last_updated_asc']
    : ['route_order', 'severity_desc', 'severity_asc', 'road_name_asc', 'road_name_desc', 'last_updated_desc', 'last_updated_asc'];

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
      const scrollableContainer = document.querySelector('#main');
      scrollableContainer.scrollTo({ top: nextElementTopPosition, behavior: 'smooth' });
    }
  };

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

        <Container className="container--sidepanel">
          { !smallScreen &&
            <div className="container--sidepanel__left">
              <RouteSearch showFilterText={true} showSpinner={showSpinner} onShowSpinnerChange={setShowSpinner}/>
              <Advisories advisories={filteredAdvisories} selectedRoute={selectedRoute} />
            </div>
          }

          <div className="container--sidepanel__right">
            <PageHeader
              title={chainUpsOnly ? 'Commercial chain-ups' : 'Delays'}
              description={chainUpsOnly ? 'Segments of the highway that require commercial vehicles over 11,794 kg to have chains on.' : 'Find out if there are any delays that might impact your journey before you go.'}>
            </PageHeader>
            <div className="sticky-sentinel" />
            <div className="sticky-filters">
              <div className="controls-group">
                <div className="controls-container">
                  <Button
                    variant="outline-primary"
                    className={'filter-option-btn filters-btn' + (activeFilterCount ? ' filtered' : '') + (showFilters ? ' active' : '')}
                    aria-label="show filters options"
                    onClick={toggleFiltersOverlay}>

                    <FontAwesomeIcon className="filters-btn__icon" icon={faSliders} />
                    <p className="btn-text">Sort & Filter</p>

                    {activeFilterCount > 0 &&
                      <span className="filter-count">{activeFilterCount}</span>
                    }
                  </Button>

                  {largeScreen &&
                    <div className="tools-container">
                      {activeFilterCount > 0 &&
                        <Button
                          variant="outline-primary"
                          className="filter-option-btn reset-filters-btn"
                          aria-label="reset all filters"
                          onClick={resetAllAppliedFilters}>
                            Reset
                        </Button>
                      }
                      {filterContext.areaFilter &&
                        <div className="selected-filters-container">
                          <div className="selected-filter">
                            <svg className="area-filter-btn__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10.9933 7.00752C10.9933 8.37761 9.16667 10.817 8.36667 11.8195C8.17333 12.0602 7.82 12.0602 7.62667 11.8195C6.82667 10.817 5 8.37761 5 7.00752C5 5.35004 6.34667 4 8 4C9.65333 4 11 5.35004 11 7.00752H10.9933ZM10.2467 7.00752C10.2467 5.76441 9.24 4.74854 7.99333 4.74854C6.74667 4.74854 5.74 5.75773 5.74 7.00752C5.74 7.20134 5.81333 7.50209 5.98 7.90309C6.14667 8.29073 6.38 8.71846 6.64667 9.15288C7.09333 9.87469 7.60667 10.5764 7.99333 11.071C8.38 10.5698 8.89333 9.87469 9.34 9.15288C9.60667 8.71846 9.84 8.29073 10.0067 7.90309C10.1733 7.50209 10.2467 7.20134 10.2467 7.00752ZM6.74667 7.00752C6.74667 6.55973 6.98667 6.14536 7.37333 5.92481C7.76 5.70426 8.23333 5.70426 8.62667 5.92481C9.02 6.14536 9.25333 6.55973 9.25333 7.00752C9.25333 7.45531 9.01333 7.86967 8.62667 8.09023C8.24 8.31078 7.76667 8.31078 7.37333 8.09023C6.98 7.86967 6.74667 7.45531 6.74667 7.00752ZM8.49333 7.00752C8.49333 6.7335 8.26667 6.50627 7.99333 6.50627C7.72 6.50627 7.49333 6.7335 7.49333 7.00752C7.49333 7.28154 7.72 7.50877 7.99333 7.50877C8.26667 7.50877 8.49333 7.28154 8.49333 7.00752Z" fill="currentColor"/>
                              <path d="M3.14031 0H3.99491C4.30691 0 4.56465 0.257736 4.56465 0.569733C4.56465 0.881729 4.30691 1.13947 3.99491 1.13947H3.14031C2.03476 1.13947 1.13947 2.03476 1.13947 3.14031V3.99491C1.13947 4.30691 0.881729 4.56465 0.569733 4.56465C0.257736 4.56465 0 4.30691 0 3.99491V3.14031C0 1.40398 1.41077 0 3.14031 0ZM0.569733 5.71089C0.881729 5.71089 1.13947 5.96863 1.13947 6.28063V9.70581C1.13947 10.0178 0.881729 10.2755 0.569733 10.2755C0.257736 10.2755 0 10.0178 0 9.70581V6.28063C0 5.96863 0.257736 5.71089 0.569733 5.71089ZM1.14625 11.9983V12.8529C1.14625 13.9585 2.04154 14.8538 3.1471 14.8538H4.0017C4.31369 14.8538 4.57143 15.1115 4.57143 15.4235C4.57143 15.7355 4.31369 15.9932 4.0017 15.9932H3.1471C1.41077 15.9932 0.00678253 14.5892 0.00678253 12.8529V11.9983C0.00678253 11.6863 0.264519 11.4286 0.576515 11.4286C0.888512 11.4286 1.14625 11.6863 1.14625 11.9983ZM5.71768 0.569733C5.71768 0.257736 5.97541 0 6.28741 0H9.71937C10.0314 0 10.2891 0.257736 10.2891 0.569733C10.2891 0.881729 10.0314 1.13947 9.71937 1.13947H6.28741C5.97541 1.13947 5.71768 0.881729 5.71768 0.569733ZM6.28741 16C5.97541 16 5.71768 15.7423 5.71768 15.4303C5.71768 15.1183 5.97541 14.8605 6.28741 14.8605H9.71937C10.0314 14.8605 10.2891 15.1183 10.2891 15.4303C10.2891 15.7423 10.0314 16 9.71937 16H6.28741ZM15.4303 4.57143C15.1183 4.57143 14.8605 4.31369 14.8605 4.0017V3.1471C14.8605 2.04154 13.9652 1.14625 12.8597 1.14625H12.0051C11.6931 1.14625 11.4354 0.888512 11.4354 0.576515C11.4354 0.264519 11.6931 0.00678253 12.0051 0.00678253H12.8597C14.596 0.00678253 16 1.41077 16 3.1471V4.0017C16 4.31369 15.7423 4.57143 15.4303 4.57143ZM16 11.9983V12.8529C16 14.5892 14.5892 15.9932 12.8597 15.9932H12.0051C11.6931 15.9932 11.4354 15.7355 11.4354 15.4235C11.4354 15.1115 11.6931 14.8538 12.0051 14.8538H12.8597C13.9652 14.8538 14.8605 13.9585 14.8605 12.8529V11.9983C14.8605 11.6863 15.1183 11.4286 15.4303 11.4286C15.7423 11.4286 16 11.6863 16 11.9983ZM15.4303 5.71089C15.7423 5.71089 16 5.96863 16 6.28063V9.70581C16 10.0178 15.7423 10.2755 15.4303 10.2755C15.1183 10.2755 14.8605 10.0178 14.8605 9.70581V6.28063C14.8605 5.96863 15.1183 5.71089 15.4303 5.71089Z" fill="currentColor"/>
                            </svg>

                            <div className="selected-filter-text">
                              {filterContext.areaFilter.name}
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

                      {/* Icons for the delay types' selected filter chips */}
                        {/* icon for Minor events */}
                        {/* <svg className="delays-filter-btn__icon" width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5.5 7.64307C5.1693 7.64307 5.00525 7.50778 4.96875 7.44971L1.02149 1.16943C1.08212 1.10753 1.24354 1.00056 1.5293 1.00049L9.4707 1.00049C9.75722 1.00056 9.91924 1.1076 9.97949 1.16943L6.03125 7.44971C5.99475 7.50778 5.8307 7.64307 5.5 7.64307Z" stroke="#013366" stroke-width="2"/>
                        </svg> */}

                        {/* icon for Major events */}
                        {/* <svg className="delays-filter-btn__icon" width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1.41421" y="6.36396" width="7" height="7" rx="1" transform="rotate(-45 1.41421 6.36396)" stroke="#013366" stroke-width="2"/>
                        </svg> */}

                        {/* icon for Future events */}
                        {/* <svg className="delays-filter-btn__icon" width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3.26562 0.515625V1.375H6.35938V0.515625C6.35938 0.236328 6.57422 0 6.875 0C7.1543 0 7.39062 0.236328 7.39062 0.515625V1.375H8.25C9.00195 1.375 9.625 1.99805 9.625 2.75V3.09375V4.125V9.625C9.625 10.3984 9.00195 11 8.25 11H1.375C0.601562 11 0 10.3984 0 9.625V4.125V3.09375V2.75C0 1.99805 0.601562 1.375 1.375 1.375H2.23438V0.515625C2.23438 0.236328 2.44922 0 2.75 0C3.0293 0 3.26562 0.236328 3.26562 0.515625ZM1.03125 4.125V5.32812H2.75V4.125H1.03125ZM1.03125 6.35938V7.73438H2.75V6.35938H1.03125ZM3.78125 6.35938V7.73438H5.84375V6.35938H3.78125ZM6.875 6.35938V7.73438H8.59375V6.35938H6.875ZM8.59375 5.32812V4.125H6.875V5.32812H8.59375ZM8.59375 8.76562H6.875V9.96875H8.25C8.42188 9.96875 8.59375 9.81836 8.59375 9.625V8.76562ZM5.84375 8.76562H3.78125V9.96875H5.84375V8.76562ZM2.75 8.76562H1.03125V9.625C1.03125 9.81836 1.18164 9.96875 1.375 9.96875H2.75V8.76562ZM5.84375 5.32812V4.125H3.78125V5.32812H5.84375Z" fill="#013366"/>
                        </svg> */}

                        {/* icon for Chain-ups */}
                        {/* <svg className="delays-filter-btn__icon" width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12.3965 5.58594L9.96875 8.01367C8.74414 9.2168 6.78906 9.2168 5.58594 8.01367C4.44727 6.85352 4.38281 5.02734 5.43555 3.80273L5.54297 3.67383C5.73633 3.45898 6.05859 3.4375 6.27344 3.63086C6.48828 3.82422 6.50977 4.14648 6.31641 4.36133L6.23047 4.46875C5.5 5.28516 5.54297 6.50977 6.31641 7.2832C7.11133 8.07812 8.42188 8.07812 9.23828 7.2832L11.666 4.85547C12.4609 4.03906 12.4609 2.75 11.666 1.93359C10.8926 1.18164 9.66797 1.13867 8.85156 1.84766L8.72266 1.95508C8.50781 2.14844 8.18555 2.12695 7.99219 1.91211C7.79883 1.69727 7.82031 1.375 8.03516 1.18164L8.16406 1.07422C9.38867 0 11.2363 0.0644531 12.3965 1.20312C13.5996 2.40625 13.5996 4.36133 12.3965 5.58594ZM1.20312 5.0918L3.65234 2.66406C4.85547 1.46094 6.81055 1.46094 8.01367 2.66406C9.17383 3.80273 9.23828 5.65039 8.16406 6.875L8.03516 7.00391C7.86328 7.21875 7.51953 7.26172 7.30469 7.06836C7.08984 6.875 7.06836 6.55273 7.26172 6.33789L7.39062 6.20898C8.09961 5.39258 8.05664 4.16797 7.2832 3.39453C6.48828 2.57812 5.17773 2.57812 4.38281 3.39453L1.93359 5.82227C1.13867 6.61719 1.13867 7.92773 1.93359 8.74414C2.70703 9.49609 3.93164 9.53906 4.74805 8.83008L4.87695 8.72266C5.0918 8.5293 5.41406 8.55078 5.60742 8.76562C5.80078 8.98047 5.7793 9.30273 5.56445 9.49609L5.43555 9.60352C4.21094 10.6777 2.36328 10.6133 1.20312 9.47461C0 8.27148 0 6.29492 1.20312 5.0918Z" fill="#013366"/>
                        </svg> */}

                        {/* icon for Closures */}
                        {/* <svg className="delays-filter-btn__icon" width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.96875 5.73633C9.96875 4.14648 9.10938 2.68555 7.73438 1.86914C6.33789 1.07422 4.64062 1.07422 3.26562 1.86914C1.86914 2.68555 1.03125 4.14648 1.03125 5.73633C1.03125 7.34766 1.86914 8.80859 3.26562 9.625C4.64062 10.4199 6.33789 10.4199 7.73438 9.625C9.10938 8.80859 9.96875 7.34766 9.96875 5.73633ZM0 5.73633C0 3.78125 1.03125 1.97656 2.75 0.988281C4.44727 0 6.53125 0 8.25 0.988281C9.94727 1.97656 11 3.78125 11 5.73633C11 7.71289 9.94727 9.51758 8.25 10.5059C6.53125 11.4941 4.44727 11.4941 2.75 10.5059C1.03125 9.51758 0 7.71289 0 5.73633ZM2.75 4.70508H8.25C8.61523 4.70508 8.9375 5.02734 8.9375 5.39258V6.08008C8.9375 6.4668 8.61523 6.76758 8.25 6.76758H2.75C2.36328 6.76758 2.0625 6.4668 2.0625 6.08008V5.39258C2.0625 5.02734 2.36328 4.70508 2.75 4.70508Z" fill="#013366"/>
                        </svg> */}

                    </div>
                  }

                  <EventListSearch
                    id="event-list-search"
                    searchText={searchText}
                    setSearchText={setSearchText}
                    chainUpsOnly={chainUpsOnly}
                  />
                </div>
                {!largeScreen &&
                    <div className="tools-container">
                      {activeFilterCount > 0 &&
                        <Button
                          variant="outline-primary"
                          className="filter-option-btn reset-filters-btn"
                          aria-label="reset all filters"
                          onClick={resetAllAppliedFilters}>
                            Reset
                        </Button>
                      }
                      {filterContext.areaFilter &&
                        <div className="selected-filters-container">
                          <div className="selected-filter">
                            <div className="selected-filter-text">
                              {filterContext.areaFilter.name}
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
                  }
              </div>
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
                  <h2>{`No ${chainUpsOnly ? 'chain-ups' : 'delays'} to display`}</h2>

                  <strong>Do you have a starting location and a destination entered?</strong>
                  <p>Adding a route will narrow down the information for the whole site, including the delays list. There might not be any delays between those two locations.</p>

                  <strong>Have you entered search terms or applied filters (e.g. an area) to narrow down the list?</strong>
                  <p>These also narrow down the {chainUpsOnly ? 'chain-ups' : 'delays'} on this page.</p>
                  <ul>
                    <li>Try checking your spelling, changing, or removing your search terms.</li>
                    <li>Remove or adjust the area filter to reveal more {chainUpsOnly ? 'chain-ups' : 'delays'} if they are in effect.</li>
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

      <FiltersOverlay
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Sort & Filter"
        showSort
        showDelayTypes={!chainUpsOnly}
        showAreas
        sortingKey={sortingKey}
        onSortingKeyChange={handleSortingKeyChange}
        sortingKeys={sortingKeys}
        areaObjects={processedEvents}
      />

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

          {!chainUpsOnly &&
            <ListFilters
              disableFeatures={true}
              enableRoadConditions={false}
              enableChainUps={true}
              textOverride={'List'}
              iconOverride={true}
              isDelaysPage={true}
              fullOverlay={true} />
          }
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
