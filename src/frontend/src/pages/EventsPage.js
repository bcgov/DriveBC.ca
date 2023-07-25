import React, { useEffect, useState, useMemo } from "react";
import { getEvents } from "../Components/data/events";
import PageHeader from "../PageHeader";
import EventsTable from "../Components/events/EventsTable";
import InfiniteScroll from "react-infinite-scroll-component";
import Container from "react-bootstrap/Container";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faRoadBarrier,
  faCalendarDays,
  faSnowflake,
  faMapLocationDot
} from "@fortawesome/free-solid-svg-icons";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [nextUrl, setNext] = useState(
    "http://localhost:8000/api/events/?limit=7&offset=0"
  );
  const [eventLength, setEventLength] = useState(0);
  
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


  async function getRoadEvents() {
    const {eventNextUrl, eventData} = await getEvents(nextUrl);
    // Next URL and data length
    setNext(eventNextUrl);
    setEventLength(eventLength + eventData.length);
    setEvents(events ? events.concat(eventData) : eventData);
  }

  useEffect(() => {
    if (!events.length > 0) {
      getRoadEvents();
    }

    return () => {
      //unmounting, so empty list object
      setEvents({});
    };
  }, []);

  return (
    <div className="camera-page">
      <PageHeader
        title="Delays"
        description="Find out if there are any delays that might impact your journey before you go."
      ></PageHeader>

      <Container>
      {/* <p>Display events: sorting</p> */}

      { events.length  && (
        <InfiniteScroll
        dataLength={eventLength}
        next={getRoadEvents}
        hasMore={nextUrl !== null}
        loader={<h4>Loading...</h4>}
        >
        <EventsTable columns={columns} data={events}/>
      </InfiniteScroll>
      )}
      </Container>

    </div>
  );
}
