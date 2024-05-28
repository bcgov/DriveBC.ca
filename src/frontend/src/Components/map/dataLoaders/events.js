import { getEvents } from '../../data/events';
import * as helpers from '../helpers';
import * as slices from '../../../slices';

// Event layers
export const loadEvents = async (route, events, filteredEvents, eventFilterPoints, dispatch, displayError) => {
  const routePoints = route ? route.points : null;

  // Load if filtered events don't exist or route doesn't match
  if (!filteredEvents || !helpers.compareRoutePoints(routePoints, eventFilterPoints)) {
    // Fetch data if it doesn't already exist
    const eventData = events ? events : await getEvents().catch((error) => displayError(error));

    // Filter data by route
    const filteredEventData = route ? helpers.filterByRoute(eventData, route, null, true) : eventData;

    dispatch(
      slices.updateEvents({
        list: eventData,
        filteredList: filteredEventData,
        filterPoints: route ? route.points : null,
        timeStamp: new Date().getTime()
      })
    );
  }
};
