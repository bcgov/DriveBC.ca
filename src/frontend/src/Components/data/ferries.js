import { get } from "./helper.js";

export function getFerries(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/ferries/`, payload).then((data) => data);
}
