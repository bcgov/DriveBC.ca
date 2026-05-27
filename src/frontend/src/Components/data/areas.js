import { get } from "./helper.js";
import { API_HOST } from '../../env';

export function getAreas() {
  return get(`${API_HOST}/api/areas/`, {}).then((data) => data);
}
