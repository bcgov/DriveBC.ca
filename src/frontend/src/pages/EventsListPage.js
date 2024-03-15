// React
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { memoize } from 'proxy-memoize';
import { updateEvents } from '../slices/feedsSlice';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAngleDown,
  faMapLocationDot
} from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import InfiniteScroll from 'react-infinite-scroll-component';

// Internal imports
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
  const { events, eventTimeStamp, selectedRoute } = useSelector(useCallback(memoize(state => ({
    events: state.feeds.events.list,
    eventTimeStamp: state.feeds.events.routeTimeStamp,
    selectedRoute: state.routes.selectedRoute
  }))));

  const loadEvents = async (route) => {
    const newRouteTimestamp = route ? route.searchTimestamp : null;

    // Fetch data if it doesn't already exist or route was updated
    if (!events || (eventTimeStamp != newRouteTimestamp)) {
      dispatch(updateEvents({
        list: await getEvents(route ? route.points : null),
        routeTimeStamp: newRouteTimestamp,
        timeStamp: new Date().getTime()
      }));
    }
  }

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

  const [routeEdit, setRouteEdit] = useState(!(selectedRoute && selectedRoute.routeFound));
  const [processedEvents, setProcessedEvents] = useState([]); // Nulls for mapping loader
  const [showLoader, setShowLoader] = useState(false);

  // Refs
  const isInitialMount = useRef(true);

  // Data loading
  const processEvents = () => {
    const hasTrue = (val) => !!val;
    const hasFilterOn = Object.values(eventCategoryFilter).some(hasTrue);

    let res = [...events];

    // Filter
    if (hasFilterOn) {
      res = res.filter((e) => !!eventCategoryFilter[e.display_category]);

    } else {
      res = res.filter((e) => e.display_category != 'roadConditions');
    }

    // Sort
    sortEvents(res, sortingKey);
    setProcessedEvents(res);
  };

  // useEffect hooks
  useEffect(() => {
    setShowLoader(true);

    if (selectedRoute && selectedRoute.routeFound) {
      setRouteEdit(false);
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (events) {
      processEvents();
      setShowLoader(false);
    }
  }, [events, eventCategoryFilter]);

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
      'road_name_asc': 'Road name, A-Z',
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
        <Dropdown.Item className={allSortingKeys[i] == sortingKey ? 'selected' : ''} onClick={(e) => sortHandler(e, allSortingKeys[i])}>
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
        <Advisories />

        <div className="controls-container">
          { largeScreen &&
            <div className="route-display-container">
              <RouteSearch routeEdit={routeEdit} />

              {!routeEdit &&
                <Button onClick={() => setRouteEdit(true)}>Change</Button>
              }
            </div>
          }

          <div className="right-container">
            <Dropdown>
              <Dropdown.Toggle>
                Sort: {getSortingDisplay(sortingKey)}
                <FontAwesomeIcon icon={faAngleDown} size="md" />
              </Dropdown.Toggle>

              <Dropdown.Menu align={largeScreen ? 'end' : 'start'} flip={false}>
                {getSortingList()}
              </Dropdown.Menu>
            </Dropdown>

            <Filters
              toggleHandler={eventCategoryFilterHandler}
              disableFeatures={true}
              enableRoadConditions={false}
            />
          </div>

          { !largeScreen &&
            <div className="route-display-container">
              <RouteSearch routeEdit={routeEdit} />

              {!routeEdit &&
                <Button onClick={() => setRouteEdit(true)}>Change</Button>
              }
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
            <div className="empty-event-display">
              <h2>No delays to display</h2>

              <h6><b>Do you have a starting location and a destination entered?</b></h6>
              <p>Adding a route will narrow down the information for the whole site, including the delays list. There might not be any delays between those two locations.</p>

              <h6><b>Have you hidden any of the layers using the filters?</b></h6>
              <p>Try toggling the filters on and off so that more information can be displayed.</p>
            </div>
          }
        </div>
      </Container>

      <Footer />
    </div>
  );
}
