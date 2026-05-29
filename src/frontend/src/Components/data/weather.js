import { get } from "./helper";
import { API_HOST } from '../../env';

export function getWeather(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${API_HOST}/api/weather/current/`, payload).then((data) => data);
}

export function getRegional(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${API_HOST}/api/weather/regional/`, payload).then((data) => data);
}

export function getHef(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${API_HOST}/api/weather/hef/`, payload).then((data) => data);
}
