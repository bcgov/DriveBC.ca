import { get } from "./helper.js";

export function getAdvisories() {
  return get(`${process.env.REACT_APP_API_HOST}/api/cms/advisories/`)
  .then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}
