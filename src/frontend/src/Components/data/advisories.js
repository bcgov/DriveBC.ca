import { get } from "./helper.js";

export function getAdvisories(id) {
  const url = `${window.API_HOST}/api/cms/advisories/`;

  return get(id ? url + id : url).then((data) => data);
}

export const getAdvisoryCounts = (advisories) => {
  // Count filtered events to store in routeDetails
  if (advisories) {
    return advisories.length;
  }
}
