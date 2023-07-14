import React, { useEffect, useState, useMemo } from "react";
import { getEvents } from "../Components/data/events";
import PageHeader from "../PageHeader";
import EventsTable from "../Components/events/EventsTable";
import InfiniteScroll from "react-infinite-scroll-component";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [nextUrl, setNext] = useState(
    "http://localhost:8000/api/events/?limit=7&offset=0"
  );
  const [eventLength, setEventLength] = useState(0);

  const columns = useMemo(() => [
    {
      header: "Type",
      accessorKey: "event_type",
    },
    {
      header: "Severity",
      accessorKey: "severity",
    },
    {
      header: "Route",
      accessorKey: "route",
    },
    {
      header: "Direction",
      accessorKey: "direction",
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
        title="Events"
        description="Events related to the BC highways."
      ></PageHeader>
      { events.length  && (
        <InfiniteScroll
        dataLength={eventLength}
        next={getRoadEvents}
        hasMore={nextUrl !== null}
        loader={<h4>Loading...</h4>}
      >
      <EventsTable columns={columns} data={events}/>
      </InfiniteScroll>
      )
}

    </div>
  );
}
