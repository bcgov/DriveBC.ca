import { get } from "./helper.js";

export function getLocations(addressInput) {
  return get(`${window.GEOCODER_HOST}/addresses.json`, {
      minScore: 65,
      maxResults: 20,
      echo: 'false',
      brief: true,
      autoComplete: true,
      addressString: addressInput
    }, {
    headers: {
      'apiKey': `${window.GEOCODER_API_AUTH_KEY}`
    }
  }).then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}
