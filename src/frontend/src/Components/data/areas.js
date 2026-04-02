import { get } from "./helper";

export function getAreas() {
  return get(`${window.API_HOST}/api/areas/`, {}).then((data) => data);
}
