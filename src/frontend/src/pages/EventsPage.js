// React
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapLocationDot,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
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

// Styling
import './EventsPage.scss';

export default function EventsPage() {
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

  const filterProps = [
    {
      id: 'checkbox-filter-incident',
      label: 'Major Delays',
      value: 'majorEvents',
    },
    {
      id: 'checkbox-filter-construction',
      label: 'Minor Delays',
      value: 'minorEvents',
    },
    {
      id: 'checkbox-filter-special',
      label: 'Future Delays',
      value: 'futureEvents',
    },
    {
      id: 'checkbox-filter-weather',
      label: 'Road Conditions',
      value: 'roadConditions',
    }
  ];

  const [sortingColumns, setSortingColumns] = useState([]);

  const [eventCategoryFilter, setEventCategoryFilter] = useState({
    'majorEvents': mapContext.visible_layers.majorEvents,
    'minorEvents': mapContext.visible_layers.minorEvents,
    'futureEvents': mapContext.visible_layers.futureEvents,
    'roadConditions': false,
  });

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
  }, [events, eventCategoryFilter, sortingColumns]);

  const eventCategoryFilterHandler = (e) => {
    const targetCategory = e.target.value;

    const newFilter = {...eventCategoryFilter};
    newFilter[targetCategory] = !newFilter[targetCategory]; // Toggle/invert value

    setEventCategoryFilter(newFilter);

    // Set context and local storage
    mapContext.visible_layers[targetCategory] = newFilter[targetCategory]; // Set identical to newFilter after change
    setMapContext(mapContext);
    localStorage.setItem('mapContext', JSON.stringify(mapContext));
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
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-primary" id="filter-dropdown">
              Filters<FontAwesomeIcon icon={faFilter} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {filterProps.map((fp) => (
                <Form.Check
                  disabled={fp.value == 'roadConditions'}
                  id={fp.id}
                  key={fp.id}
                  label={
                    <span>{fp.icon}{fp.label}</span>
                  }
                  value={fp.value}
                  checked={eventCategoryFilter[fp.value]}
                  onChange={eventCategoryFilterHandler} />
              ))}
            </Dropdown.Menu>
          </Dropdown>
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
