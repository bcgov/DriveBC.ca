// React
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { updateAdvisories } from '../slices/cmsSlice';
import { updateEvents } from '../slices/feedsSlice';

// External imports
import { booleanIntersects, point, lineString, polygon } from '@turf/turf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAngleDown,
  faMapLocationDot
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import InfiniteScroll from 'react-infinite-scroll-component';

// Internal imports
import {
  compareRoutePoints,
  filterByRoute,
} from '../Components/map/helper';
import { getAdvisories } from '../Components/data/advisories';
import { getEvents } from '../Components/data/events';
import { MapContext } from '../App.js';
import { defaultSortFn, routeSortFn, severitySortFn } from '../Components/events/functions';
import Advisories from '../Components/advisories/Advisories';
import EventCard from '../Components/events/EventCard';
import EventsTable from '../Components/events/EventsTable';
import EventTypeIcon from '../Components/EventTypeIcon';
import Filters from '../Components/Filters.js';
import Footer from '../Footer.js';
import FriendlyTime from '../Components/FriendlyTime';
import PageHeader from '../PageHeader';
import RouteSearch from '../Components/map/RouteSearch';

// Styling
import './EventsListPage.scss';
import '../Components/Filters.scss';

// Helpers
const sortEvents = (events, key) => {
  switch (key) {
    case 'severity_desc':
    case 'severity_asc':
        events.sort((a, b) =>
          key.endsWith('_asc') ? severitySortFn(a, b) : severitySortFn(a, b) * -1
        );
        break;
    case 'road_name_desc':
    case 'road_name_asc':
        events.sort((a, b) =>
          key.endsWith('_asc') ? routeSortFn(a, b) : routeSortFn(a, b) * -1
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
  const { mapContext, setMapContext } = useContext(MapContext);

  // States
  const [sortingKey, setSortingKey] = useState('severity_desc');
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

  // Refs
  const isInitialMount = useRef(true);

  // Data functions
  const getAdvisoriesData = async (eventsData) => {
    let advData = advisories;

    if (!advisories) {
      advData = await getAdvisories();

      dispatch(updateAdvisories({
        list: advData,
        timeStamp: new Date().getTime()
      }));
    }

    // load all advisories if no route selected
    const resAdvisories = !selectedRoute ? advData : [];

    // Route selected, load advisories that intersect  with at least one event on route
    if (selectedRoute && advData && advData.length > 0 && eventsData && eventsData.length > 0) {
      for (const adv of advData) {
        const advPoly = polygon(adv.geometry.coordinates);

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
    const routePoints = route ? route.points : null;

    // Load if filtered cams don't exist or route doesn't match
    if (!filteredEvents || !compareRoutePoints(routePoints, eventFilterPoints)) {
      // Fetch data if it doesn't already exist
      const eventData = events ? events : await getEvents();

      // Filter data by route
      const filteredEventData = route ? filterByRoute(eventData, route) : eventData;

      dispatch(
        updateEvents({
          list: eventData,
          filteredList: filteredEventData,
          filterPoints: route ? route.points : null
        })
      );
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

    // Sort
    sortEvents(res, sortingKey);
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
  const eventCategoryFilterHandler = (targetCategory, check, lineToggle) => {
    if (!lineToggle) {
      const newFilter = {...eventCategoryFilter};
      newFilter[targetCategory] = !newFilter[targetCategory]; // Toggle/invert value

      setEventCategoryFilter(newFilter);

      // Set context and local storage
      mapContext.visible_layers[targetCategory] = newFilter[targetCategory]; // Set identical to newFilter after change
      setMapContext(mapContext);
      localStorage.setItem('mapContext', JSON.stringify(mapContext));
    }
  };

  const handleRoute = (event) => {
    navigate('/', {state: event});
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
      'severity_desc': 'Severity, Closure to Minor',
      'severity_asc': 'Severity, Minor to Closure',
      'road_name_asc': 'Road name, A–Z',
      'road_name_desc': 'Road name, Z-A',
      'last_updated_desc': 'Last updated, New to Old',
      'last_updated_asc': 'Last updated, Old to New',
    }

    return sortingDisplayMap[key];
  }

  const allSortingKeys = ['severity_desc', 'severity_asc', 'road_name_asc', 'road_name_desc',  'last_updated_desc', 'last_updated_asc'];
  const getSortingList = () => {
    const res = [];
    for (let i = 0; i < allSortingKeys.length; i++) {
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
      <PageHeader
        title="Delays"
        description="Find out if there are any delays that might impact your journey before you go.">
      </PageHeader>

      <Container>
        <Advisories advisories={advisoriesInRoute} />

        <div className="controls-container">
          { largeScreen &&
            <div className="route-display-container">
              <RouteSearch showFilterText={true} />
            </div>
          }

          <div className="right-container">
            <Dropdown>
              <Dropdown.Toggle>
                Sort: {getSortingDisplay(sortingKey)}
                <FontAwesomeIcon icon={faAngleDown} />
              </Dropdown.Toggle>

              <Dropdown.Menu align={largeScreen ? 'end' : 'start'} flip={false}>
                {getSortingList()}
              </Dropdown.Menu>
            </Dropdown>

            <Filters
              toggleHandler={eventCategoryFilterHandler}
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
