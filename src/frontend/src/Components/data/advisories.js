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

export const markAdvisoriesAsRead = (advisoriesData, cmsContext, setCMSContext) => {
  const advisoriesIds = advisoriesData.map(advisory => advisory.id.toString() + '-' + advisory.live_revision.toString());

  // Combine and remove duplicates
  const readAdvisories = Array.from(new Set([...advisoriesIds, ...cmsContext.readAdvisories]));
  const updatedContext = {...cmsContext, readAdvisories: readAdvisories};

  setCMSContext(updatedContext);
  localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
}
