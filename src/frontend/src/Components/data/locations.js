import { get } from "./helper.js";

export function getLocations(addressInput) {
  return get(`${process.env.REACT_APP_GEOCODER_HOST}/addresses.json`, {
      minScore: 50,
      maxResults: 5,
      echo: 'false',
      brief: true,
      autoComplete: true,
      addressString: addressInput
    }, {
    headers: {
      'apiKey': `${process.env.REACT_APP_GEOCODER_API_AUTH_KEY}`
    }
  }).then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}
