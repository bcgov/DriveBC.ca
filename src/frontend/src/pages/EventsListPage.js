// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { updateEvents } from '../slices/feedsSlice';
import { memoize } from 'proxy-memoize'

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapLocationDot
} from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Container from 'react-bootstrap/Container';
import InfiniteScroll from 'react-infinite-scroll-component';

// Components and functions
import { getEvents } from '../Components/data/events';
import { MapContext } from '../App.js';
import EventCard from '../Components/events/EventCard';
import EventsTable from '../Components/events/EventsTable';
import FriendlyTime from '../Components/FriendlyTime';
import PageHeader from '../PageHeader';
import Footer from '../Footer.js';
import EventTypeIcon from '../Components/EventTypeIcon';
import Advisories from '../Components/advisories/Advisories';
import Filters from '../Components/Filters.js';

// Styling
import './EventsListPage.scss';
import '../Components/Filters.scss';

export default function EventsListPage() {
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
        routeTimeStamp: route ? route.searchTimestamp : null,
        timeStamp: new Date().getTime()
      }));
    }
  }

  // Context
  const { mapContext, setMapContext } = useContext(MapContext);

  const isInitialMount = useRef(true);

  const navigate = useNavigate();

  const columns = [
    {
      header: 'Type',
      accessorKey: 'display_category',
      cell: (props) => <EventTypeIcon displayCategory={props.getValue()} />,
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      cell: (props) => <span>{props.getValue().toLowerCase()}</span>,
    },
    {
      header: 'Road',
      accessorKey: 'route_at',
    },
    {
      header: 'Direction',
      accessorKey: 'direction',
      cell: (props) => <span>{props.getValue().toLowerCase()}</span>,
      enableSorting: false,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      enableSorting: false,
    },
    {
      header: 'Last Update',
      accessorKey: 'last_updated',
      cell: (props) => <FriendlyTime date={props.getValue()} />,
    },
    {
      header: 'Map',
      accessorKey: 'map',
      cell: (props) => <FontAwesomeIcon icon={faMapLocationDot} />,
      enableSorting: false,
    },
  ];

  const [sortingColumns, setSortingColumns] = useState([]);

  const [eventCategoryFilter, setEventCategoryFilter] = useState({
    'closures': mapContext.visible_layers.closures,
    'majorEvents': mapContext.visible_layers.majorEvents,
    'minorEvents': mapContext.visible_layers.minorEvents,
    'futureEvents': mapContext.visible_layers.futureEvents,
    'roadConditions': false,
  });

  const [processedEvents, setProcessedEvents] = useState([]);
  const [displayedEvents, setDisplayedEvents] = useState([]);

  const sortEvents = (unsortedEvents) => {
    // Sort by severity by default
    let sortKey = "severity";
    let descending = false;

    if (sortingColumns.length) {
      const {id, desc} = sortingColumns[0];

      sortKey = id;
      descending = desc;
    }

    unsortedEvents.sort((firstEvent, secondEvent) => {
      return firstEvent[sortKey] > secondEvent[sortKey] ? (descending ? -1 : 1) : (descending ? 1 : -1);
    });
  };

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
    sortEvents(res);

    setProcessedEvents(res);
  };

  const getDisplayedEvents = (reset) => {
    const res = processedEvents.slice(0, reset? 10 : displayedEvents.length + 10);
    setDisplayedEvents(res);
  };

  const handleRoute = (event) => {
    navigate('/', {state: event});
  };

  useEffect(() => {
    if (isInitialMount.current) { // Run only on startup
      loadEvents(selectedRoute);
      isInitialMount.current = false;
    }
  });

  useEffect(() => {
    getDisplayedEvents(true);
  }, [processedEvents]);

  useEffect(() => {
    if (events) {
      processEvents();
    }
  }, [events, eventCategoryFilter, sortingColumns]);

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

  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Workaround for DBC22-1090
  // https://github.com/TanStack/table/issues/3740
  const dupeLastRow = (arr) => {
    const cpy = [...arr, arr[arr.length-1]];
    return cpy;
  }

  return (
    <div className="events-page">
      <PageHeader
        title="Delays"
        description="Find out if there are any delays that might impact your journey before you go.">
      </PageHeader>
      <Container>
      <Advisories />
        <div className="sort-and-filter">
          <div className="sort"></div>

          <Filters
            toggleHandler={eventCategoryFilterHandler}
            disableFeatures={true}
          />
        </div>

        { events && !!events.length && (
          <InfiniteScroll
            dataLength={displayedEvents.length}
            next={getDisplayedEvents}
            hasMore={displayedEvents.length < processedEvents.length}
            loader={<h4>Loading...</h4>}>

            { largeScreen && displayedEvents.length > 0 &&
              <EventsTable columns={columns} data={dupeLastRow(displayedEvents)} sortingHandler={setSortingColumns} routeHandler={handleRoute} />
            }

            { !largeScreen &&
              <div className="events-list">
                { displayedEvents.map(
                  (e) => (
                    <div className="card-selector" key={e.id} onClick={() => handleRoute(e)}>
                      <EventCard
                        className="event"
                        event={e}
                        icon= {<EventTypeIcon eventCategory={e.display_category} />}
                      />
                    </div>
                  ),
                )}
              </div>
            }
          </InfiniteScroll>
        )}
      </Container>
      <Footer />
    </div>
  );
}
