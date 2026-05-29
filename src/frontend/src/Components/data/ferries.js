import { get } from "./helper";
import { API_HOST } from '../../env';

export function getFerries(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${API_HOST}/api/ferries/`, payload).then((data) => data);
}


export function getCoastalFerries(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${API_HOST}/api/ferries/coastal/`, payload).then((data) => data);
}
