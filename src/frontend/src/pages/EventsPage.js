// React
import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import { useSelector } from 'react-redux'

// Third party packages
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faMapLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import {useMediaQuery} from '@uidotdev/usehooks';
import Container from 'react-bootstrap/Container';
import InfiniteScroll from 'react-infinite-scroll-component';

// Components and functions
import {getEvents} from '../Components/data/events';
import EventCard from '../Components/events/EventCard';
import EventsTable from '../Components/events/EventsTable';
import EventFilter from '../Components/events/EventFilter';
import FriendlyTime from '../Components/FriendlyTime';
import PageHeader from '../PageHeader';
import Footer from '../Footer.js';
import EventTypeIcon from '../Components/EventTypeIcon';
import Advisories from '../Components/advisories/Advisories';

// Styling
import './EventsPage.scss';

export default function EventsPage() {
  const isInitialMount = useRef(true);

  const navigate = useNavigate();

  const [ eventFilters ] = useSelector((state) => [
    state.eventFilters.filterSet,
  ]);

  const columns = [
    {
      header: 'Type',
      accessorKey: 'event_type',
      cell: (props) => <EventTypeIcon eventType={props.getValue().toLowerCase()} />,
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
    },
    {
      header: 'Description',
      accessorKey: 'description',
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

  const [events, setEvents] = useState([]);
  const [processedEvents, setProcessedEvents] = useState([]);
  const [displayedEvents, setDisplayedEvents] = useState([]);

  const getData = async () => {
    const eventsData = await getEvents();
    setEvents(eventsData);

    isInitialMount.current = false;
  };

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
    const hasFilterOn = Object.values(eventFilters).some(hasTrue);

    let res = [...events];

    // Filter
    if (hasFilterOn) {
      res = res.filter((e) => !!eventFilters[e.event_type]);
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
    getData();

    return () => {
      // Unmounting, set to empty list
      setEvents([]);
    };
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) { // Do not run on startup
      getDisplayedEvents(true);
    }
  }, [processedEvents]);

  useEffect(() => {
    if (!isInitialMount.current) { // Do not run on startup
      processEvents();
    }
  }, [events, eventFilters, sortingColumns]);

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
       <EventFilter />

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
                        icon= {<EventTypeIcon eventType={e.event_type.toLowerCase()} />}
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
