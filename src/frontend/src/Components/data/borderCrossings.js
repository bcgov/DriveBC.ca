import { get } from "./helper.js";

// Env Variables
import { API_HOST } from "../../env.js";

export function getBorderCrossings() {
  return get(`${API_HOST}/api/bordercrossings/`, {}).then((data) => data);
}
