import { get } from "./helper.js";

export function getAdvisories(id) {
  const url = `${window.API_HOST}/api/cms/advisories/`;

  return get(id ? url + id : url).then((data) => data);
}

export function getAdvisoriesPreview(id) {
  // Base URL with a cache-busting timestamp
  const baseUrl = `${window.API_HOST}/api/cms/advisories/`;

  // If we have an ID, fetch that specific advisory
  // If not, fetch the list
  const url = id
    ? `${baseUrl}${id}/?preview=true&timestamp=${Date.now()}`
    : `${baseUrl}?preview=true&timestamp=${Date.now()}`;

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
  if (advisoriesData && advisoriesData.length !== 0 && advisoriesData[0].live_revision == null) {
    return;
  }

  const advisoriesIds = advisoriesData.map(advisory => advisory.id.toString() + '-' + advisory.live_revision.toString());

  // Combine and remove duplicates
  const readAdvisories = Array.from(new Set([...advisoriesIds, ...cmsContext.readAdvisories]));
  const updatedContext = {...cmsContext, readAdvisories: readAdvisories};

  setCMSContext(updatedContext);
  localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
}
