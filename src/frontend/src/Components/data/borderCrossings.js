import { get } from "./helper";
import { API_HOST } from '../../env';

export function getBorderCrossings() {
  return get(`${API_HOST}/api/bordercrossings/`, {}).then((data) => data);
}
