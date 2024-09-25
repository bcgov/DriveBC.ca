import { compareRoutePoints } from '../helpers/spatial';
import { getEvents } from '../../data/events';

// Event layers
export const loadEvents = async (route, events, filteredEvents, eventFilterPoints, dispatch, displayError, worker) => {
  const routePoints = route ? route.points : null;

  // Load if filtered objs don't exist or route doesn't match
  if (!filteredEvents || !compareRoutePoints(routePoints, eventFilterPoints)) {
    // Fetch data if it doesn't already exist
    const eventData = events ? events : await getEvents().catch((error) => displayError(error));

    // Trigger filter worker
    worker.postMessage({data: eventData, route: (route && route.routeFound ? route : null), action: 'updateEvents'});
  }
};
