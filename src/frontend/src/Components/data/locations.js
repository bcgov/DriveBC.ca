import { get } from "./helper.js";

export function getLocations(addressInput) {
  return get(`${window.GEOCODER_HOST}/addresses.json`, {
      minScore: 50,
      maxResults: 7,
      echo: 'false',
      brief: true,
      autoComplete: true,
      addressString: addressInput,
      locationDescriptor: 'routingPoint' 
    }, {
      'apiKey': `${window.GEOCODER_API_AUTH_KEY}`,
    }
  ).then((data) => data);
}
