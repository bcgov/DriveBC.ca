import { get } from "./helper";
import { API_HOST } from '../../env';

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

// export const markAdvisoriesAsRead = (advisories, cmsContext, setCMSContext) => {
//   const newRead = advisories
//     .filter(a => a.id && a.last_notified_at)
//     .map(a => a.id.toString() + '-' + a.last_notified_at.toString());

//   const merged = [...new Set([...cmsContext.readAdvisories, ...newRead])];
//   setCMSContext(prev => ({ ...prev, readAdvisories: merged }));
// }

export const markAdvisoriesAsRead = (advisories, cmsContext, setCMSContext) => {
  if (!advisories) return;

  const newRead = advisories
    .filter(a => a.id && a.last_notified_at)
    .map(a => a.id.toString() + '-' + a.last_notified_at.toString());

  if (newRead.length === 0) return;

  setCMSContext((prevContext) => {
    const previousRead = prevContext?.readAdvisories || [];
    const merged = [...new Set([...previousRead, ...newRead])];

    if (merged.length === previousRead.length) {
      return prevContext;
    }

    const updatedContext = { ...prevContext, readAdvisories: merged };
    localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
    return updatedContext;
  });
}