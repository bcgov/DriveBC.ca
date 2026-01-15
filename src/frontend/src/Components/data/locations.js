import { get } from "./helper.js";

// Env Variables
import { GEOCODER_HOST, GEOCODER_API_CLIENT_ID } from "../../env.js";

export function getLocations(addressInput) {
  return get(`${GEOCODER_HOST}/addresses.json`, {
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
      'apiKey': `${GEOCODER_API_CLIENT_ID}`,
    }
  ).then((data) => data);
}
