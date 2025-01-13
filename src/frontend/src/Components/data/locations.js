import { get } from "./helper.js";

export function getLocations(addressInput) {
  return get(`${window.GEOCODER_HOST}/addresses.json`, {
      minScore: 50,
      maxResults: 7,
      echo: 'false',
      brief: true,
      autoComplete: true,
      addressString: addressInput,
      exactSpelling: false,
      locationDescriptor: 'routingPoint',
      fuzzyMatch: true,
    }, {
      'apiKey': `${window.GEOCODER_API_CLIENT_ID}`,
    }
  ).then((data) => data);
}
