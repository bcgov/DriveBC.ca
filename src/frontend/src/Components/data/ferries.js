import { get } from "./helper.js";

export function getFerries() {
  const payload = {};

  return get(`${window.API_HOST}/api/cms/ferries/`, payload)
  .then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}
