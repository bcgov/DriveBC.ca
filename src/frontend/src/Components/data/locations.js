import { get } from "./helper.js";

function escapeCqlString(value) {
  return String(value).replace(/'/g, "''");
}

function sanitizeForILikePrefix(value) {
  return String(value).replace(/%/g, "").replace(/_/g, "");
}

function normalizeRoutableLocationFeature(feature) {
  const props = feature.properties || {};
  const displayName = props.name != null ? String(props.name) : "";
  return {
    ...feature,
    properties: {
      ...props,
      fullAddress: displayName,
    },
  };
}

export function getExtraLocations(addressInput) {
  // return empty promise if address input is less than 2 characters
  const trimmed = (addressInput || "").trim();
  if (trimmed.length < 2) {
    return Promise.resolve({ type: "FeatureCollection", features: [] });
  }

  // escape CQL string and sanitize for ILike prefix
  const literal = escapeCqlString(sanitizeForILikePrefix(trimmed));
  return get(
    `${window.ROUTABLE_LOCATIONS_HOST}`,
    {
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "public:routable-locations",
      outputFormat: "application/json",
      maxFeatures: 5,
      cql_filter: `authority='DriveBC' and name ilike '%${literal}%'`,
    },
    {},
    false,
  );
}

export function getLocations(addressInput) {
  const geocoderPromise = get(`${window.GEOCODER_HOST}/addresses.json`, {
    minScore: 50,
    maxResults: 7,
    echo: "false",
    brief: true,
    autoComplete: true,
    addressString: addressInput,
    exactSpelling: false,
    locationDescriptor: "routingPoint",
    fuzzyMatch: true,
  }, {
    apiKey: `${window.GEOCODER_API_CLIENT_ID}`,
  });

  const extraPromise = getExtraLocations(addressInput).catch(() => ({
    type: "FeatureCollection",
    features: [],
  }));

  // return all features from geocoder and extra locations
  return Promise.all([geocoderPromise, extraPromise]).then(
    ([geoData, extraData]) => {
      const extraFeatures = (extraData.features || []).map(
        normalizeRoutableLocationFeature,
      );
      const geoFeatures = geoData.features || [];
      return {
        ...geoData,
        features: [...extraFeatures, ...geoFeatures],
      };
    },
  );
}
