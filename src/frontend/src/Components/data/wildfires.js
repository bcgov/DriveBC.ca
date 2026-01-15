import { get } from "./helper.js";

// Env Variables
import { API_HOST } from "../../env.js";

export function getWildfires() {
  return get(`${API_HOST}/api/wildfires/`, {}).then((data) => data);
}
