import { get } from "./helper.js";

export function getBorderCrossings() {
  return get(`${window.API_HOST}/api/bordercrossings/`, {}).then((data) => data);
}
