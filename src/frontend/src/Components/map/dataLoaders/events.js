import { getEventDetails, getEvents } from '../../data/events';

// Event layers
const loadEventDetail = async (event_id, displayError) => {
  return await getEventDetails(event_id).catch((error) => displayError(error));
}

export const loadEvents = async (
  route, dispatch, displayError,
  worker, isInitialLoad = true, trackedEventsRef
) => {
  // Fetch data
  const eventData = await getEvents(!isInitialLoad).catch((error) => displayError(error));

  // Track unfiltered events' highlight status and last_updated timestamp
  const trackedEventsDict = eventData.reduce((acc, event) => {
    const trackedEvent = (trackedEventsRef && trackedEventsRef.current[event.id]) ?
      trackedEventsRef.current[event.id] : null;

    if (trackedEvent) {
      event.location = trackedEvent.location;
      event.polygon = trackedEvent.polygon;
    }

    acc[event.id] = {
      location: event.location,
      polygon: event.polygon,
      highlight: trackedEvent ? event.last_updated !== trackedEvent.last_updated || trackedEvent.highlight : !isInitialLoad,
      last_updated: event.last_updated
    };

    // Set the updated flag if the event has been updated since the initial load
    event.highlight = acc[event.id].highlight;

    return acc;
  }, {});

  // Fetch locations for events that were newly added from polling calls
  for (const event of eventData) {
    if (!event.location) {
      const eventDetails = await loadEventDetail(event.id);
      event.location = eventDetails.location;
      trackedEventsDict[event.id].location = eventDetails.location;

      event.polygon = eventDetails.polygon;
      trackedEventsDict[event.id].polygon = eventDetails.polygon;
    }
  }

  if (trackedEventsRef) {
    // Remove items that no longer exist
    Object.keys(trackedEventsRef.current).forEach((key) => {
      if (!trackedEventsDict[key]) {
        delete trackedEventsRef.current[key];
      }
    });

    trackedEventsRef.current = trackedEventsDict;
  }

  // Trigger filter worker
  worker.postMessage({ data: eventData, route: route, action: 'updateEvents' });
};
