import { get } from "./helper.js";

// Env Variables
import { API_HOST } from "../../env.js";

export function getAdvisories(id) {
  const url = `${API_HOST}/api/cms/advisories/`;

  return get(id ? url + id : url).then((data) => data);
}

export function getAdvisoriesPreview(id) {
  // Base URL with a cache-busting timestamp
  const baseUrl = `${API_HOST}/api/cms/advisories/`;
  const url = `${baseUrl}${id}/?preview=true&timestamp=${Date.now()}`

  return get(url).then((data) => {
    return data;
  });
}

export const getAdvisoryCounts = (advisories) => {
  // Count filtered events to store in routeDetails
  if (advisories) {
    return advisories.length;
  }
}

export const markAdvisoriesAsRead = (advisoriesData, cmsContext, setCMSContext) => {
  if (advisoriesData && advisoriesData.length > 0 && !advisoriesData[0].live_revision) return;
  const advisoriesIds = advisoriesData.map(advisory => advisory.id.toString() + '-' + advisory.live_revision.toString());

  // Combine and remove duplicates
  const readAdvisories = Array.from(new Set([...advisoriesIds, ...cmsContext.readAdvisories]));
  const updatedContext = {...cmsContext, readAdvisories: readAdvisories};

  setCMSContext(updatedContext);
  localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
}
