import { get } from "./helper.js";

export function getBulletins(id) {
  const url = `${process.env.REACT_APP_API_HOST}/api/cms/bulletins/`;

  return get(id ? url + id : url)
  .then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}