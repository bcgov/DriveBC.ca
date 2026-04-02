import { get } from "./helper";

export function getDms(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/dms/`, payload).then((data) => data);
}
