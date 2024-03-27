import { get } from "./helper.js";

export function getRestStops(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/reststops/`, payload)
  .then((data) => {
    console.log(data); 
    return data})
  .catch((error) => {
    console.log(error);
  });
}
