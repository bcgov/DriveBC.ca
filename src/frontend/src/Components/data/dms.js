import { get } from "./helper.js";

export function getDms(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/dms/`, payload).then((data) => data);
}
