// React
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { updateAdvisories } from '../slices/cmsSlice';
import { updateEvents } from '../slices/feedsSlice';

// External imports
import { booleanIntersects, point, lineString, multiPolygon } from '@turf/turf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAngleDown
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';

// Internal imports
import {
  compareRoutePoints,
  filterByRoute,
} from '../Components/map/helpers';
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
import EventTypeIcon from '../Components/events/EventTypeIcon';
import Filters from '../Components/shared/Filters.js';
import Footer from '../Footer.js';
import PageHeader from '../PageHeader';
import RouteSearch from '../Components/routing/RouteSearch';
import trackEvent from '../Components/shared/TrackEvent.js';

// Styling
import './EventsListPage.scss';
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
  const navigate = useNavigate();
  document.title = 'DriveBC - Delays';

  // Redux
  const dispatch = useDispatch();
  const { advisories, events, filteredEvents, eventFilterPoints, selectedRoute } = useSelector(useCallback(memoize(state => ({
    advisories: state.cms.advisories.list,
    events: state.feeds.events.list,
    filteredEvents: state.feeds.events.filteredList,
    eventFilterPoints: state.feeds.events.filterPoints,
    eventTimeStamp: state.feeds.events.routeTimeStamp,
    selectedRoute: state.routes.selectedRoute
  }))));

  // Context
  const { mapContext } = useContext(MapContext);

  // States
  const [sortingKey, setSortingKey] = useState(selectedRoute && selectedRoute.routeFound ? 'route_order' : 'severity_desc');
  const [eventCategoryFilter, setEventCategoryFilter] = useState({
    'closures': mapContext.visible_layers.closures,
    'majorEvents': mapContext.visible_layers.majorEvents,
    'minorEvents': mapContext.visible_layers.minorEvents,
    'futureEvents': mapContext.visible_layers.futureEvents,
    'roadConditions': false,
  });
  const [processedEvents, setProcessedEvents] = useState([]); // Nulls for mapping loader
  const [showLoader, setShowLoader] = useState(false);
  const [advisoriesInRoute, setAdvisoriesInRoute] = useState([]);
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

  // Refs
  const isInitialMount = useRef(true);

  // Data functions
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

    // Route selected, load advisories that intersect  with at least one event on route
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
  };

  const loadEvents = async route => {
    const routePoints = route && route.routeFound ? route.points : null;

    // Load if filtered cams don't exist or route doesn't match
    if (!filteredEvents || !compareRoutePoints(routePoints, eventFilterPoints)) {
      // Fetch data if it doesn't already exist
      const eventData = events ? events : await getEvents().catch((error) => displayError(error));

      // Filter data by route
      const filteredEventData = route && route.routeFound ? filterByRoute(eventData, route, null, true) : eventData;

      dispatch(
        updateEvents({
          list: eventData,
          filteredList: filteredEventData,
          filterPoints: route && route.routeFound ? route.points : null
        })
      );

    // Stop loader if data already exists
    } else {
      setShowLoader(false);
    }
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
      setSortingKey('severity_desc');
      sortEvents(res, 'severity_desc');
    }

    setProcessedEvents(res);
    getAdvisoriesData(res);
  };

  // useEffect hooks
  useEffect(() => {
    setShowLoader(true);

  }, [selectedRoute]);

  useEffect(() => {
    if (events) {
      processEvents();
      setShowLoader(false);
    }
  }, [filteredEvents, eventCategoryFilter]);

  useEffect(() => {
    if (showLoader) {
      loadEvents(selectedRoute);
    }
  }, [showLoader]);

  useEffect(() => {
    // Do nothing on initial run
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    sortEvents(processedEvents, sortingKey);
    setProcessedEvents(processedEvents);

  }, [sortingKey]);

  // Handlers
  const toggleEventCategoryFilter = (targetCategory, check) => {
    const newFilter = {...eventCategoryFilter};
    newFilter[targetCategory] = check;

    setEventCategoryFilter(newFilter);
  };

  const handleRoute = (event) => {
    trackEvent('click', 'event', 'events list page', event.event_type, event.event_sub_type);

    const refEventData = { ...event };
    refEventData.type = 'event';

    navigate('/', { state: refEventData });
  };

  const sortHandler = (e, key) => {
    e.preventDefault();
    if (sortingKey != key) {
      setSortingKey(key);
    }
  }

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
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  return (
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

      <Container>
        <Advisories advisories={advisoriesInRoute} selectedRoute={selectedRoute} />

        <div className="controls-container">
          { largeScreen &&
            <div className="route-display-container">
              <RouteSearch showFilterText={true} />
            </div>
          }

          <div className="right-container">
            <Dropdown>
              <Dropdown.Toggle disabled={selectedRoute && selectedRoute.routeFound}>
                Sort: {getSortingDisplay(sortingKey)}
                <FontAwesomeIcon icon={faAngleDown} />
              </Dropdown.Toggle>

              <Dropdown.Menu align={largeScreen ? 'end' : 'start'} flip={false}>
                {getSortingList()}
              </Dropdown.Menu>
            </Dropdown>

            <Filters
              callback={toggleEventCategoryFilter}
              disableFeatures={true}
              enableRoadConditions={false}
              textOverride={'List filters'}
            />
          </div>

          { !largeScreen &&
            <div className="route-display-container">
              <RouteSearch showFilterText={true} />
            </div>
          }
        </div>

        <div>
          { largeScreen && !!processedEvents.length &&
            <EventsTable data={processedEvents} routeHandler={handleRoute} showLoader={showLoader} sortingKey={sortingKey} />
          }

          { !largeScreen &&
            <div className="events-list">
              { !showLoader && processedEvents.map(
                (e) => (
                  <div className="card-selector" key={e.id}
                    onClick={() => handleRoute(e)}
                    onKeyDown={(keyEvent) => {
                      if (keyEvent.keyCode == 13) {
                        handleRoute(e);
                      }
                    }}>

                    <EventCard
                      className="event"
                      event={e}
                      icon={<EventTypeIcon event={e} />}
                    />
                  </div>
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

          {!processedEvents.length &&
            <Container className="empty-event-display">
              <h2>No delays to display</h2>

              <strong>Do you have a starting location and a destination entered?</strong>
              <p>Adding a route will narrow down the information for the whole site, including the delays list. There might not be any delays between those two locations.</p>

              <strong>Have you hidden any of the layers using the filters?</strong>
              <p>Try toggling the filters on and off so that more information can be displayed.</p>
            </Container>
          }
        </div>
      </Container>

      <Footer />
    </div>
  );
}
