/* eslint-disable no-prototype-builtins */

import { get } from "./helper.js";

export function getEventDetails(id) {
  return get(`${window.API_HOST}/api/events/${id}/`).then((data) => data);
}

export function getEvents(polling=false) {
  const endpoint = polling ? `${window.API_HOST}/api/eventspolling/` : `${window.API_HOST}/api/events/`;
  return get(endpoint).then((data) => data);
}

export const getEventCounts = (events) => {
  // Count filtered events to store in routeDetails
  if (events) {
    const eventCounts = {
      closures: 0,
      majorEvents: 0,
      minorEvents: 0,
      roadConditions: 0,
      futureEvents: 0,
      chainUps: 0,
    }

    events.forEach(e => {
      const eventType = e.display_category;
      if (eventType && Object.hasOwn(eventCounts, eventType)) {
        const hasOwn = Object.hasOwn ?
          Object.hasOwn(eventCounts, eventType) :
          eventCounts.hasOwnProperty(eventType);

        if (hasOwn) {
          eventCounts[eventType] += 1;
        }
      }
    });

    return eventCounts;
  }
}
