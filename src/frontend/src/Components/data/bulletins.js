import { get } from "./helper.js";

export function getBulletins(id) {
  const url = `${window.API_HOST}/api/cms/bulletins/`;

  return get(id ? url + id : url).then((data) => data);
}

export function markBulletinsAsRead(bulletinsData, cmsContext, setCMSContext) {
  const bulletinsIds = bulletinsData.map(bulletin => bulletin.id.toString() + '-' + bulletin.live_revision.toString());

  // Combine and remove duplicates
  const readBulletins = Array.from(new Set([...bulletinsIds, ...cmsContext.readBulletins]));
  const updatedContext = {...cmsContext, readBulletins: readBulletins};

  setCMSContext(updatedContext);
  localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
}
