import { get } from "./helper.js";

export function getEvents(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/events/`, payload)
  .then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}
