import { get } from "./helper.js";

export function getWeather(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/weather/current/`, payload).then((data) => data);
}

export function getRegional(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/weather/regional/`, payload).then((data) => data);
}

export function getHef(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/weather/hef/`, payload).then((data) => data);
}
