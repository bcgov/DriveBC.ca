import { get } from "./helper";

export function getBorderCrossings() {
  return get(`${window.API_HOST}/api/bordercrossings/`, {}).then((data) => data);
}
