import { get } from "./helper.js";

export function getWildfires() {
  return get(`${window.API_HOST}/api/wildfires/`, {}).then((data) => data);
}
