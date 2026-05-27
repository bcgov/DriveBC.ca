import { get } from "./helper.js";
import { API_HOST } from '../../env';

export function getDms(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${API_HOST}/api/dms/`, payload).then((data) => data);
}
