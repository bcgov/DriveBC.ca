// React
import React, { useEffect, useRef, useState } from "react";

// Third party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faPersonDigging,
  faCalendarDays,
  faSnowflake,
  faMapLocationDot,
  faFilter
} from "@fortawesome/free-solid-svg-icons";
import { useMediaQuery } from "@uidotdev/usehooks";
import Container from "react-bootstrap/Container";
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import InfiniteScroll from "react-infinite-scroll-component";

// Components and functions
import { getEvents } from "../Components/data/events";
import EventCard from "../Components/events/EventCard";
import EventsTable from "../Components/events/EventsTable";
import FriendlyTime from "../Components/FriendlyTime";
import PageHeader from "../PageHeader";
import Footer from "../Footer.js";

// Styling
import "./EventsPage.scss";

export default function EventsPage() {
  const isInitialMount = useRef(true);

  //event type icons
  const incident = <FontAwesomeIcon icon={faTriangleExclamation} alt="incident" />;
  const construction = <FontAwesomeIcon icon={faPersonDigging} alt="construction" />;
  const special_event = <FontAwesomeIcon icon={faCalendarDays} alt="special event" />;
  const weather_condition = <FontAwesomeIcon icon={faSnowflake} alt="weather condition" />;

  const columns = [
    {
      header: "Type",
      accessorKey: "event_type",
      cell: props => {
        switch(props.getValue().toLowerCase()) {
          case "incident":
            return <span>{incident}</span>;
          case "construction":
            return <span>{construction}</span>;
          case "special_event":
            return <span>{special_event}</span>;
          case "weather_condition":
            return <span>{weather_condition}</span>;
          default:
            return <span>{incident}</span>;
        }
      }
    },
    {
      header: "Severity",
      accessorKey: "severity",
      cell: props => <span>{props.getValue().toLowerCase()}</span>
    },
    {
      header: "Route",
      accessorKey: "route_display",
    },
    {
      header: "Direction",
      accessorKey: "direction",
      cell: props => <span>{props.getValue().toLowerCase()}</span>
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Last Update",
      accessorKey: "last_updated",
      cell: props => <FriendlyTime date={props.getValue()} />
    },
    {
      header: "Map",
      accessorKey: "map",
      cell: props => <FontAwesomeIcon icon={faMapLocationDot} />,
      enableSorting: false
    },
  ];

  const filterProps = [
    {
      id: "checkbox-filter-incident",
      label: "Incidents",
      icon: incident,
      value: "INCIDENT",
    },
    {
      id: "checkbox-filter-weather",
      label: "Road Conditions",
      icon: weather_condition,
      value: "WEATHER_CONDITION",
    },
    {
      id: "checkbox-filter-construction",
      label: "Current Events",
      icon: construction,
      value: "CONSTRUCTION",
    },
    {
      id: "checkbox-filter-special",
      label: "Future Events",
      icon: special_event,
      value: "SPECIAL_EVENT",
    }
  ];

  const [sortingColumns, setSortingColumns] = useState([]);

  const [eventTypeFilter, setEventTypeFilter] = useState({
    "CONSTRUCTION": false,
    "INCIDENT": false,
    "SPECIAL_EVENT": false,
    "WEATHER_CONDITION": false,
  });

  const [events, setEvents] = useState([]);
  const [processedEvents, setProcessedEvents] = useState([]);
  const [displayedEvents, setDisplayedEvents] = useState([]);

  const getData = async () => {
    const eventsData = await getEvents();
    setEvents(eventsData);

    isInitialMount.current = false;
  }

  const sortEvents = (unsortedEvents) => {
    // Sort by ID by default
    let sortKey = "id";
    let descending = false;

    if (sortingColumns.length) {
      const { id, desc } = sortingColumns[0];

      sortKey = id;
      descending = desc;
    }

    unsortedEvents.sort((first_event, second_event) => {
      return first_event[sortKey] > second_event[sortKey] ? (descending ? -1 : 1) : (descending ? 1 : -1);
    });
  }

  const processEvents = () => {
    const hasTrue = (val) => !!val;
    const hasFilterOn = Object.values(eventTypeFilter).some(hasTrue);

    let res = [...events];

    // Filter
    if (hasFilterOn) {
      res = res.filter((e) => !!eventTypeFilter[e.event_type]);
    }

    // Sort
    sortEvents(res);

    setProcessedEvents(res);
  }

  const getDisplayedEvents = (reset) => {
    const res = processedEvents.slice(0, reset? 10 : displayedEvents.length + 10);
    setDisplayedEvents(res);
  }

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
  }, [events, eventTypeFilter, sortingColumns]);

  const eventTypeFilterHandler = (e) => {
    const event_type = e.target.value;

    const newFilter = {...eventTypeFilter};
    newFilter[event_type] = !newFilter[event_type];

    setEventTypeFilter(newFilter);
  }

  const largeScreen = useMediaQuery("only screen and (min-width : 768px)");

  return (
    <div className="events-page">
      <PageHeader
        title="Delays"
        description="Find out if there are any delays that might impact your journey before you go.">
      </PageHeader>
      <Container>
        <div className="sort-and-filter">
          <div className="sort"></div>
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-primary" id="filter-dropdown">
              Filters<FontAwesomeIcon icon={faFilter} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {filterProps.map((fp) => (
                <Form.Check
                  id={fp.id}
                  label={
                    <span>{fp.icon}{fp.label}</span>
                  }
                  value={fp.value}
                  checked={eventTypeFilter[fp.value]}
                  onChange={eventTypeFilterHandler} />
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

            {largeScreen ?
              <EventsTable columns={columns} data={displayedEvents} sortingHandler={setSortingColumns} /> :
              <div className="events-list">
                { displayedEvents.map(
                  (e) => (
                    <EventCard
                      className="event"
                      event={e}
                      icon={ filterProps.find(type => type.value === e.event_type).icon }
                    />
                  )
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
