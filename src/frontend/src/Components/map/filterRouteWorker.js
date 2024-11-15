import { filterAdvisoryByRoute, filterByRoute } from './helpers/spatial';

self.onmessage = (event) => {
  const { data, route, action, existingData = [] } = event.data;

  let filteredData = data;
  if (route) {
    switch(action) {
      case 'updateAdvisories':
        filteredData = filterAdvisoryByRoute(data, route);
        break;
      case 'updateCameras':
      case 'updateEvents':
        filteredData = filterByRoute(data, route, null, true);
        break;
      default:
        filteredData = filterByRoute(data, route, null, false);
        break;
    }
  }

  if (action === 'updateEvents') {
    // Get a mapping of previously loaded events by id and their highlight status
    const loadedEvents = existingData.reduce((events, event) => {
      events[event.id] = {
        highlight: event.highlight || false,
        last_updated: event.last_updated
      };
      return events;
    }, {});

    // Add the highlight status to the event data
    filteredData = filteredData.map(event => {
      const loadedEvent = loadedEvents[event.id];
      const highlight = loadedEvent // If the event has been loaded before, mark as highlighted if last_updated is different or was previously highlighted
        ? event.last_updated !== loadedEvent.last_updated || loadedEvent.highlight
        : existingData.length !== 0; // If existing data, mark the event as highlighted
      return { ...event, highlight };
    });
  }

  postMessage({ data, filteredData, route, action });
};
