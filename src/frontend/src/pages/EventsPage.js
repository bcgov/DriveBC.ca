// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Third party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faRoadBarrier,
  faCalendarDays,
  faSnowflake,
  faMapLocationDot,
  faFilter
} from "@fortawesome/free-solid-svg-icons";
import Container from "react-bootstrap/Container";
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';
import InfiniteScroll from "react-infinite-scroll-component";

// Components and functions
import { getEvents } from "../Components/data/events";
import EventsTable from "../Components/events/EventsTable";
import PageHeader from "../PageHeader";

//Styling
import "../EventsPage.scss";

export default function EventsPage() {
  const isInitialMount = useRef(true);

  const incident = <FontAwesomeIcon icon={faTriangleExclamation} alt="incident" />;
  const construction = <FontAwesomeIcon icon={faRoadBarrier} alt="construction" />;
  const special_event = <FontAwesomeIcon icon={faCalendarDays} alt="special event" />;
  const weather_condition = <FontAwesomeIcon icon={faSnowflake} alt="weather condition" />;

  const columns = useMemo(() => [
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
      accessorKey: "route",
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
      cell: props => {
        const datetime_format = {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        };
        const last_update_time = new Date(props.getValue());
        const last_update_time_formatted = new Intl.DateTimeFormat("en-US", datetime_format).format(last_update_time);
        return last_update_time_formatted;
      }
    },
    {
      header: "Map",
      accessorKey: "map",
      cell: props => <FontAwesomeIcon icon={faMapLocationDot} />
    },
  ], []);

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

  const [eventTypeFilter, setEventTypeFilter] = useState({
    "CONSTRUCTION": false,
    "INCIDENT": false,
    "SPECIAL_EVENT": false,
    "WEATHER_CONDITION": false,
  });

  const getDefaultEventsUrl = () => {
    const default_params = {
      limit: 7,
      offset: 0
    }

    const event_type_filter = Object.keys(eventTypeFilter).filter(function(k){return eventTypeFilter[k]}).map(String);
    if (event_type_filter.length) {
      default_params.event_type__in = event_type_filter;
    }

    return `//${process.env.REACT_APP_API_HOST}/api/events/?${new URLSearchParams(default_params)}`;
  }

  const [dataUrl, setDataUrl] = useState(getDefaultEventsUrl);
  const [events, setEvents] = useState([]);

  async function getData(url) {
    const {eventNextUrl, eventData} = await getEvents(url ? url : dataUrl);

    setDataUrl(eventNextUrl);

    // Reset events on filter change
    setEvents(url ? eventData : events.concat(eventData));

    // Update initial mount state
    isInitialMount.current = false;
  }

  useEffect(() => {
    if (!events.length) {
      getData();
    }

    return () => {
      // Unmounting, set to empty list
      setEvents([]);
    };
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) { // Only run on updates
      setDataUrl(getDefaultEventsUrl());
      getData(getDefaultEventsUrl());
    }
  }, [eventTypeFilter]);

  const eventTypeFilterHandler = (e) => {
    const event_type = e.target.value;

    const newFilter = {...eventTypeFilter};
    newFilter[event_type] = !newFilter[event_type];

    setEventTypeFilter(newFilter);
  }

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

        { events && events.length && (
          <InfiniteScroll
            dataLength={events.length}
            next={getData}
            hasMore={dataUrl !== null}
            loader={<h4>Loading...</h4>}>

            <EventsTable columns={columns} data={events}/>
          </InfiniteScroll>
        )}
        </Container>
    </div>
  );
}
