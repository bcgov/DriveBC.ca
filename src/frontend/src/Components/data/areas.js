import { get } from "./helper.js";

export function getAreas() {
  return get(`${window.API_HOST}/api/areas/`, {}).then((data) => data);
}
