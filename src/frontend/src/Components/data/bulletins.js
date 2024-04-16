import { get } from "./helper.js";

export function getBulletins(id) {
  const url = `${window.API_HOST}/api/cms/bulletins/`;

  return get(id ? url + id : url).then((data) => data);
}
