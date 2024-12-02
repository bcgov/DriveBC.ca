import { compareRoutePoints } from '../helpers/spatial';
import { getEvents } from '../../data/events';

// Event layers
export const loadEvents = async (route, events, filteredEvents, eventFilterPoints, dispatch, displayError, worker, isInitialLoad = true, trackedEventsRef) => {
  const routePoints = route ? route.points : null;

  // Load if filtered objs don't exist or route doesn't match
  if (!filteredEvents || !compareRoutePoints(routePoints, eventFilterPoints)) {

    // Fetch data
    const eventData = await getEvents().catch((error) => displayError(error));

    // Track unfiltered events' highlight status and last_updated timestamp
    const trackedEventsDict = eventData.reduce((acc, event) => {
      const trackedEvent = (trackedEventsRef && trackedEventsRef.current[event.id]) ?? { highlight: !isInitialLoad, last_updated: event.last_updated };

      acc[event.id] = {
        highlight: trackedEvent ? event.last_updated !== trackedEvent.last_updated || trackedEvent.highlight : !isInitialLoad,
        last_updated: event.last_updated
      };

      // Set the updated flag if the event has been updated since the initial load
      event.highlight = acc[event.id].highlight;

      return acc;
    }, {});

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
    worker.postMessage({ data: eventData, route: (route && route.routeFound ? route : null), action: 'updateEvents' });
  }
};
