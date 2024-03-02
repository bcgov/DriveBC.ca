import { get } from "./helper.js";

export function getWeather(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/weather/current`, payload)
  .then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}
