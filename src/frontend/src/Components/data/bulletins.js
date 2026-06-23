import { get } from "./helper.js";
import { API_HOST } from '../../env';

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

export const markBulletinsAsRead = (bulletins, cmsContext, setCMSContext) => {
  if (!bulletins) return;

  const newRead = bulletins
    .filter(b => b.id && b.last_notified_at)
    .map(b => b.id.toString() + '-' + b.last_notified_at.toString());

  if (newRead.length === 0) return;

  setCMSContext((prevContext) => {
    const previousRead = prevContext?.readBulletins || [];
    const merged = [...new Set([...previousRead, ...newRead])];

    if (merged.length === previousRead.length) {
      return prevContext;
    }

    const updatedContext = { ...prevContext, readBulletins: merged };
    localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
    return updatedContext;
  });
}