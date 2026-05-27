import { get } from "./helper.js";
import { API_HOST } from '../../env';

export function getWildfires() {
  return get(`${API_HOST}/api/wildfires/`, {}).then((data) => data);
}
