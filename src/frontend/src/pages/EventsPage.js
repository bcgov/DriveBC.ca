// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Third party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faRoadBarrier,
  faCalendarDays,
  faSnowflake,
  faMapLocationDot
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
    },
    {
      header: "Map",
      accessorKey: "map",
      cell: props => <FontAwesomeIcon icon={faMapLocationDot} />
    },
  ], []);

  const filterProps = [
    {
      id: "checkbox-filter-construction",
      label: "Construction",
      value: "CONSTRUCTION",
    },
    {
      id: "checkbox-filter-incident",
      label: "Incident",
      value: "INCIDENT",
    },
    {
      id: "checkbox-filter-special",
      label: "Special event",
      value: "SPECIAL_EVENT",
    },
    {
      id: "checkbox-filter-weather",
      label: "Weather condition",
      value: "WEATHER_CONDITION",
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

    return "http://localhost:8000/api/events/?" + new URLSearchParams(default_params);
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
    <div className="camera-page">
      <PageHeader
        title="Delays"
        description="Find out if there are any delays that might impact your journey before you go.">
      </PageHeader>

      <DropdownButton id="filter-dropdown" title="Filters">
        {filterProps.map((fp) => (
          <Form.Check
            id={fp.id}
            label={fp.label}
            value={fp.value}
            checked={eventTypeFilter[fp.value]}
            onChange={eventTypeFilterHandler} />
        ))}
      </DropdownButton>

      { events && events.length && (
        <InfiniteScroll
          dataLength={events.length}
          next={getData}
          hasMore={dataUrl !== null}
          loader={<h4>Loading...</h4>}>

          <EventsTable columns={columns} data={events}/>
        </InfiniteScroll>
      )}
    </div>
  );
}
