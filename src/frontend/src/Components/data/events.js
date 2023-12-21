import { get } from "./helper.js";

export function getEvents(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/events/`, payload)
  .then((data) => {
    data.forEach((datum) => {
      datum.roadIsClosed = !! datum.description.match(/Road closed(\.| )/);
      if (datum.roadIsClosed) {
        datum.severity = 'CLOSURE';
        datum.display_category = 'closure';
      }
    })
    return data;
  })
  .catch((error) => {
    console.log(error);
  });
}
