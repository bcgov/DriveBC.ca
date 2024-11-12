import { get } from "./helper.js";

export function getEvents(routePoints, alternateEndpoint=false) {
  const payload = routePoints ? { route: routePoints } : {};

  if (alternateEndpoint) {
    return get(`${window.API_HOST}/api/test/delays/`, payload).then((data) => data);
  }

  return get(`${window.API_HOST}/api/events/`, payload).then((data) => data);
}

export const getEventCounts = (events) => {
  // Count filtered events to store in routeDetails
  if (events) {
    const eventCounts = {
      closures: 0,
      majorEvents: 0,
      minorEvents: 0,
      roadConditions: 0,
      chainUps: 0,
    }

    events.forEach(e => {
      const eventType = e.display_category;
      if (eventType && Object.hasOwn(eventCounts, eventType)) {
        eventCounts[eventType] += 1;
      }
    });

    return eventCounts;
  }
}
