import { get } from "./helper.js";
import { API_HOST } from '../../env';

export function getBorderCrossings() {
  return get(`${API_HOST}/api/bordercrossings/`, {}).then((data) => data);
}
