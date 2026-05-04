import { get } from "./helper";

export function getFerries(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/ferries/`, payload).then((data) => data);
}


export function getCoastalFerries(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/ferries/coastal/`, payload).then((data) => data);
}
