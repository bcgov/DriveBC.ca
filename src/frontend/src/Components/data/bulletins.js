import { get } from "./helper.js";

export function getBulletins(id) {
  const url = `${window.API_HOST}/api/cms/bulletins/`;

  return get(id ? url + id : url).then((data) => data);
}

export function getBulletinsPreview(id) {
  // Base URL with a cache-busting timestamp
  const baseUrl = `${window.API_HOST}/api/cms/bulletins/`;

  // If we have an ID, fetch that specific bulletins
  // If not, fetch the list
  const url = id
    ? `${baseUrl}${id}/?preview=true&timestamp=${Date.now()}`
    : `${baseUrl}?preview=true&timestamp=${Date.now()}`;

  return get(url).then((data) => {
    console.log("Preview bulletins data:", data);
    return data;
  });
}

export function markBulletinsAsRead(bulletinsData, cmsContext, setCMSContext) {
  if (!bulletinsData) {
    return;
  }
  
  if (bulletinsData && bulletinsData.length !== 0 && bulletinsData[0].live_revision == null) {
    return;
  }

  const bulletinsIds = bulletinsData.map(bulletin => bulletin.id.toString() + '-' + bulletin.live_revision.toString());

  // Combine and remove duplicates
  const readBulletins = Array.from(new Set([...bulletinsIds, ...cmsContext.readBulletins]));
  const updatedContext = {...cmsContext, readBulletins: readBulletins};

  setCMSContext(updatedContext);
  localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
}
