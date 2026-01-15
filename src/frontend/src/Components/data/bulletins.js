import { get } from "./helper.js";

// Env Variables
import { API_HOST } from "../../env.js";

export function getBulletins(id) {
  const url = `${API_HOST}/api/cms/bulletins/`;

  return get(id ? url + id : url).then((data) => data);
}

export function getBulletinsPreview(id) {
  // Base URL with a cache-busting timestamp
  const baseUrl = `${API_HOST}/api/cms/bulletins/`;
  const url = `${baseUrl}${id}/?preview=true&timestamp=${Date.now()}`

  return get(url).then((data) => {
    return data;
  });
}

export function markBulletinsAsRead(bulletinsData, cmsContext, setCMSContext) {
  if (bulletinsData && bulletinsData.length > 0 && !bulletinsData[0].live_revision) return;
  const bulletinsIds = bulletinsData.map(bulletin => bulletin.id.toString() + '-' + bulletin.live_revision.toString());

  // Combine and remove duplicates
  const readBulletins = Array.from(new Set([...bulletinsIds, ...cmsContext.readBulletins]));
  const updatedContext = {...cmsContext, readBulletins: readBulletins};

  setCMSContext(updatedContext);
  localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
}
