// React
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { updateAdvisories } from '../slices/cmsSlice';
import * as slices from '../slices';

// External imports
import { booleanIntersects, point, lineString, multiPolygon } from '@turf/turf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAngleDown,
  faBarsSort,
  faRoute,
  faXmark,
  faFlag
} from '@fortawesome/pro-solid-svg-icons';
import {
  faArrowUp,
  faArrowDown,
  faRoute as faRouteEmpty
} from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';

// Internal imports
import { CMSContext } from '../App';
import { getAdvisories } from '../Components/data/advisories';
import { getEvents } from '../Components/data/events';
import { MapContext } from '../App.js';
import { defaultSortFn, routeAtSortFn, routeOrderSortFn, severitySortFn } from '../Components/events/functions';
import { NetworkError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Advisories from '../Components/advisories/Advisories';
import EventCard from '../Components/events/EventCard';
import EventsTable from '../Components/events/EventsTable';
import Filters from '../Components/shared/Filters.js';
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';
import PollingComponent from '../Components/shared/PollingComponent';
import RouteSearch from '../Components/routing/RouteSearch';
import trackEvent from '../Components/shared/TrackEvent.js';
import AdvisoriesPanel from '../Components/map/panels/AdvisoriesPanel';

// Styling
import './EventsListPage.scss';
import './ContainerSidePanel.scss';
import '../Components/shared/Filters.scss';

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

  // Redux
  const dispatch = useDispatch();
  const { advisories, events, filteredEvents, eventFilterPoints, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    events: state.feeds.events.list,
    filteredEvents: state.feeds.events.filteredList,
    eventFilterPoints: state.feeds.events.filterPoints,
    selectedRoute: state.routes.selectedRoute
  }))));

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);
  const { mapContext } = useContext(MapContext);

  // States
  const [sortingKey, setSortingKey] = useState(selectedRoute && selectedRoute.routeFound ? 'route_order' : (localStorage.getItem('sorting-key')? localStorage.getItem('sorting-key') : 'severity_desc'));
  const [eventCategoryFilter, setEventCategoryFilter] = useState({
    'closures': mapContext.visible_layers.closures,
    'majorEvents': mapContext.visible_layers.majorEvents,
    'minorEvents': mapContext.visible_layers.minorEvents,
    'futureEvents': mapContext.visible_layers.futureEvents,
    'roadConditions': false,
  });
  const [processedEvents, setProcessedEvents] = useState([]); // Nulls for mapping loader
  const [trackedEvents, setTrackedEvents] = useState({}); // Track event updates between refreshes
  const [showLoader, setShowLoader] = useState(true);
  const [loadData, setLoadData] = useState(true);
  const [advisoriesInRoute, setAdvisoriesInRoute] = useState([]);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [openAdvisoriesOverlay, setOpenAdvisoriesOverlay] = useState(false);
  const [openSearchOverlay, setOpenSearchOverlay] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [updateCounts, setUpdateCounts] = useState({above: 0, below: 0});

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
  const workerRef = useRef();
  const eventRefs = useRef({});
  const viewedHighlightedEvents = useRef(new Set());
  const eventsInViewport = useRef({});

  // Media queries
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');
  const xXlargeScreen = useMediaQuery('only screen and (min-width : 1200px)');

  // Data functions
  const markAdvisoriesAsRead = (advisoriesData) => {
    const advisoriesIds = advisoriesData.map(advisory => advisory.id.toString() + '-' + advisory.live_revision.toString());

    // Combine and remove duplicates
    const readAdvisories = Array.from(new Set([...advisoriesIds, ...cmsContext.readAdvisories]));
    const updatedContext = {...cmsContext, readAdvisories: readAdvisories};

    setCMSContext(updatedContext);
    localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
  }

  const getAdvisoriesData = async (eventsData) => {
    let advData = advisories;

    if (!advisories) {
      advData = await getAdvisories().catch((error) => displayError(error));

      dispatch(updateAdvisories({
        list: advData,
        timeStamp: new Date().getTime()
      }));
    }

    // load all advisories if no route selected
    const resAdvisories = selectedRoute && selectedRoute.routeFound ? [] : advData;

    // Route selected, load advisories that intersect with at least one event on route
    if (selectedRoute && selectedRoute.routeFound && advData && advData.length > 0 && eventsData && eventsData.length > 0) {
      for (const adv of advData) {
        const advPoly = multiPolygon(adv.geometry.coordinates);

        for (const event of eventsData) {
          // Event geometry, point or line based on type
          const eventGeom = event.location.type == 'Point' ? point(event.location.coordinates) : lineString(event.location.coordinates);
          if (booleanIntersects(advPoly, eventGeom)) {
            // advisory intersects with an event, add to list and break loop
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

  const loadEvents = async route => {
    // Fetch data
    const eventData = await getEvents().catch((error) => displayError(error));

    // Track unfiltered events' highlight status and last_updated timestamp
    const trackedEventsDict = eventData.reduce((acc, event) => {
      const trackedEvent = trackedEvents[event.id] ?? null;

      acc[event.id] = {
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

    setTrackedEvents(trackedEventsDict);

    if (isInitialLoad.current)
      isInitialLoad.current = false;

    workerRef.current.postMessage({ data: eventData, route: (route && route.routeFound ? route : null), action: 'updateEvents' });
  }

  const processEvents = () => {
    const hasTrue = (val) => !!val;
    const hasFilterOn = Object.values(eventCategoryFilter).some(hasTrue);

    let res = [...filteredEvents];

    // Filter
    if (hasFilterOn) {
      res = res.filter((e) => !!eventCategoryFilter[e.display_category]);

    } else {
      res = res.filter((e) => e.display_category != 'roadConditions');
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
    getAdvisoriesData(res);
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
        const { data, filteredData, route, action } = event.data;

        // compare new and existing data here and tag them
        dispatch(
          slices[action]({
            list: data,
            filteredList: filteredData,
            filterPoints: route ? route.points : null,
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
  }, [filteredEvents, eventCategoryFilter]);

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
  const toggleEventCategoryFilter = (targetCategory, check) => {
    const newFilter = {...eventCategoryFilter};
    newFilter[targetCategory] = check;

    setEventCategoryFilter(newFilter);
  };

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
          { xXlargeScreen &&
            <div className="container--sidepanel__left">
              <RouteSearch showFilterText={true} showSpinner={showSpinner} onShowSpinnerChange={setShowSpinner}/>
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

              { !xXlargeScreen &&
                <Button
                  className={`findRoute-btn ${(selectedRoute && selectedRoute.routeFound) ? 'routeFound' : ''}`}
                  variant="outline-primary"
                  aria-label={(selectedRoute && selectedRoute.routeFound)? 'Edit route' : 'Find route'}
                  onClick={() => setOpenSearchOverlay(!openSearchOverlay)}>
                    <FontAwesomeIcon icon={(selectedRoute && selectedRoute.routeFound) ? faRoute : faRouteEmpty } />
                    {(selectedRoute && selectedRoute.routeFound)? 'Edit route' : 'Find route'}
                </Button>
              }

              <Dropdown className="sorting">
                <Dropdown.Toggle variant="outline-primary" disabled={selectedRoute && selectedRoute.routeFound}>
                  {xXlargeScreen ?
                    <React.Fragment>
                      Sort: {getSortingDisplay(sortingKey)}
                      <FontAwesomeIcon icon={faAngleDown} />
                    </React.Fragment>
                    :
                    <React.Fragment>
                      <span className="sr-only" aria-hidden="false">Sorting options</span>
                      <FontAwesomeIcon icon={faBarsSort} />
                    </React.Fragment>}
                </Dropdown.Toggle>

                <Dropdown.Menu align={largeScreen ? 'end' : 'start'} flip={false}>
                  {getSortingList()}
                </Dropdown.Menu>
              </Dropdown>

              <Filters
                callback={toggleEventCategoryFilter}
                disableFeatures={true}
                enableRoadConditions={false}
                textOverride={xXlargeScreen ? 'List filters': ' '}
                isDelaysPage={true}
              />
            </div>

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
            aria-hidden={`${openSearchOverlay ? false : true}`}
            tabIndex={`${openSearchOverlay ? 0 : -1}`}
            onClick={() => setOpenSearchOverlay(!openSearchOverlay)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>

          <p className="overlay__header bold">Find route</p>

          <RouteSearch showFilterText={true} showSpinner={showSpinner} onShowSpinnerChange={setShowSpinner}/>
        </div>
      }
    </React.Fragment>
  );
}
