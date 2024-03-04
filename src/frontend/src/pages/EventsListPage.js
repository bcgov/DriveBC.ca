// React
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { memoize } from 'proxy-memoize';
import { updateEvents } from '../slices/feedsSlice';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapLocationDot
} from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import InfiniteScroll from 'react-infinite-scroll-component';

// Internal imports
import { getEvents } from '../Components/data/events';
import { MapContext } from '../App.js';
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

export default function EventsListPage() {
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

  const navigate = useNavigate();

  const columns = [
    {
      header: 'Type',
      accessorKey: 'display_category',
      sortingFn: 'typeSort',
      cell: (props) => <EventTypeIcon event={props.row.original} />,
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      sortingFn: 'severitySort',
      sortDescFirst: true,
      cell: (props) => <span>{props.getValue().toLowerCase()}</span>,
    },
    {
      header: 'Road',
      accessorKey: 'route_at',
      sortingFn: 'routeSort',
    },
    {
      header: 'Direction',
      accessorKey: 'direction_display',
      cell: (props) => <span>{props.getValue()}</span>,
      enableSorting: false,
    },
    {
      header: 'Location',
      accessorKey: 'location_description',
      cell: (props) => <span>{props.getValue()}</span>,
      enableSorting: false,
    },
    {
      header: 'Closest Landmark',
      accessorKey: 'closest_landmark',
      cell: (props) => <span>{props.getValue() ? props.getValue() : '-'}</span>,
      enableSorting: false,
    },
    {
      header: 'Description',
      accessorKey: 'optimized_description',
      enableSorting: false,
    },
    {
      header: 'Last Update',
      accessorKey: 'last_updated',
      cell: (props) => <FriendlyTime date={props.getValue()} />,
      sortDescFirst: true,
    },
    {
      header: 'Next Update',
      accessorKey: 'next_update',
      cell: (props) => props.getValue() ? <FriendlyTime date={props.getValue()} /> : '-',
      enableSorting: false,
    },
    {
      header: 'Map',
      accessorKey: 'map',
      cell: (props) => <FontAwesomeIcon icon={faMapLocationDot} />,
      enableSorting: false,
    },
  ];

  // States
  const [sortingColumns, setSortingColumns] = useState([]);

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
    setProcessedEvents(res);
  };

  const handleRoute = (event) => {
    navigate('/', {state: event});
  };

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

  // Rendering
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
          <div className="route-display-container">
            <RouteSearch routeEdit={routeEdit} />

            {!routeEdit &&
              <Button onClick={() => setRouteEdit(true)}>Change</Button>
            }
          </div>

          <Filters
            toggleHandler={eventCategoryFilterHandler}
            disableFeatures={true}
            enableRoadConditions={false}
          />
        </div>

        <div>
          { largeScreen &&
            <EventsTable columns={columns} data={processedEvents} sortingHandler={setSortingColumns} routeHandler={handleRoute} showLoader={showLoader} />
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
        </div>
      </Container>

      <Footer />
    </div>
  );
}
