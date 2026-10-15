import { toTitleCase } from './textFormatting';

const DEFAULT_DESCRIPTION =
  'Check real-time BC road conditions, closures, highway webcams, and delays with DriveBC.';

export function setPageSeoDescription(description) {
  const plainText = getPlainText(description).slice(0, 160);
  getMeta('meta[name="description"]', 'content', plainText);
  getMeta('meta[property="og:description"]', 'content', plainText);
}

export function getCmsContentSeoDescription(content) {
  const description = getPlainText(
    content?.teaser || content?.rendered_body,
  ).slice(0, 160);
  return description || DEFAULT_DESCRIPTION;
}

function getPlainText(value) {
  if (!value) {
    return '';
  }

  return new DOMParser()
    .parseFromString(value, 'text/html')
    .body.textContent.replace(/\s+/g, ' ')
    .trim();
}

function getMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement(
      selector.startsWith('meta') ? 'meta' : 'link',
    );
    if (selector.startsWith('meta')) {
      const name = selector.match(/(?:name|property)="([^"]+)"/)?.[1];
      element.setAttribute(
        selector.includes('property=') ? 'property' : 'name',
        name,
      );
    } else {
      element.rel = 'canonical';
    }
    document.head.append(element);
  }

  element.setAttribute(attribute, value);
}

export function getCameraSeoMetadata(camera, origin) {
  const name = getPlainText(camera?.name) || 'Highway camera';
  const highway = getPlainText(camera?.highway_display || camera?.highway);
  const caption = getPlainText(camera?.caption);
  const title = highway
    ? `${name} - Highway ${highway} Camera | DriveBC`
    : `${name} | DriveBC`;
  const fallbackDescription = highway
    ? `View the live highway camera for ${name} on Highway ${highway} with DriveBC.`
    : `View the live highway camera for ${name} with DriveBC.`;
  const description = (caption || fallbackDescription).slice(0, 160);

  return {
    title,
    description: description || DEFAULT_DESCRIPTION,
    canonicalUrl: `${origin.replace(/\/+$/, '')}/cameras/${camera.id}`,
  };
}

export function setCameraSeoMetadata(camera, origin) {
  const { title, description, canonicalUrl } = getCameraSeoMetadata(
    camera,
    origin,
  );
  document.title = title;
  getMeta('meta[name="description"]', 'content', description);
  getMeta('meta[property="og:title"]', 'content', title);
  getMeta('meta[property="og:description"]', 'content', description);
  getMeta('meta[property="og:url"]', 'content', canonicalUrl);
  getMeta('link[rel="canonical"]', 'href', canonicalUrl);
}

function getEntityName(featureType, feature) {
  const properties = feature?.properties || {};
  switch (featureType) {
    case 'ferry':
      return feature?.route_name || feature?.name || 'Ferry service';
    case 'restStop':
    case 'largeRestStop':
      return properties.REST_AREA_NAME || 'Rest area';
    case 'localWeather':
      return feature?.weather_station_name || 'Roadside weather station';
    case 'regionalWeather':
      return feature?.name || 'Regional weather';
    case 'hef':
      return (
        feature?.hwyDescription || feature?.name || 'High elevation weather'
      );
    default:
      return 'DriveBC';
  }
}

function getEntityDescription(featureType, feature, name) {
  const properties = feature?.properties || {};
  switch (featureType) {
    case 'ferry':
      return (
        feature?.route_description ||
        `Ferry service for ${name} in British Columbia.`
      );
    case 'restStop':
    case 'largeRestStop': {
      const highway = properties.HIGHWAY_NUMBER
        ? ` on Highway ${properties.HIGHWAY_NUMBER}`
        : '';
      const distance = properties.DISTANCE_FROM_MUNICIPALITY
        ? `, ${toTitleCase(properties.DISTANCE_FROM_MUNICIPALITY)}`
        : '';
      return `${name}${highway}${distance}. Rest area information from DriveBC.`;
    }
    case 'localWeather':
      return (
        feature?.location_description ||
        `Current road and weather information for ${name} from DriveBC.`
      );
    case 'regionalWeather':
      return (
        feature?.conditions?.TextSummary ||
        `Weather forecast and current conditions for ${name} from DriveBC.`
      );
    case 'hef':
      return `High elevation weather forecast for ${name} from DriveBC.`;
    default:
      return DEFAULT_DESCRIPTION;
  }
}

export function getMapFeatureSeoMetadata(
  featureType,
  feature,
  origin,
  coastal = false,
) {
  const entityName = getPlainText(getEntityName(featureType, feature));
  const name =
    featureType === 'restStop' || featureType === 'largeRestStop'
      ? toTitleCase(entityName)
      : entityName;
  const titleSuffix = {
    restStop: 'Rest Stop',
    largeRestStop: 'Rest Stop',
    localWeather: 'Roadside Weather',
    regionalWeather: 'Regional Weather',
    hef: 'High Elevation Weather',
  }[featureType];
  const title = `${name}${titleSuffix ? ` ${titleSuffix}` : ''} | DriveBC`;
  const description = getPlainText(
    getEntityDescription(featureType, feature, name),
  ).slice(0, 160);
  const canonicalType =
    featureType === 'largeRestStop' ? 'restStop' : featureType;
  const canonicalPath = {
    restStop: `/rest-stop/${feature.id}`,
    largeRestStop: `/rest-stop/${feature.id}`,
    ferry: coastal ? `/coastal-ferry/${feature.id}` : `/ferry/${feature.id}`,
    localWeather: `/roadside-weather/${feature.id}`,
    regionalWeather: `/regional-weather/${feature.id}`,
    hef: `/high-elevation-weather/${feature.id}`,
  }[featureType];
  const params = new URLSearchParams({
    type: canonicalType,
    id: String(feature.id),
  });
  if (featureType === 'ferry' && coastal) {
    params.set('coastal', 'true');
  }

  return {
    title,
    description: description || DEFAULT_DESCRIPTION,
    canonicalUrl: canonicalPath
      ? `${origin.replace(/\/+$/, '')}${canonicalPath}`
      : `${origin.replace(/\/+$/, '')}/?${params.toString()}`,
  };
}

export function setMapFeatureSeoMetadata(
  featureType,
  feature,
  origin,
  coastal = false,
) {
  const { title, description, canonicalUrl } = getMapFeatureSeoMetadata(
    featureType,
    feature,
    origin,
    coastal,
  );
  document.title = title;
  getMeta('meta[name="description"]', 'content', description);
  getMeta('meta[property="og:title"]', 'content', title);
  getMeta('meta[property="og:description"]', 'content', description);
  getMeta('meta[property="og:url"]', 'content', canonicalUrl);
  getMeta('link[rel="canonical"]', 'href', canonicalUrl);
}

export function resetMapFeatureSeoMetadata() {
  resetSeoMetadata();
}

export function resetSeoMetadata() {
  document.title = 'DriveBC';
  getMeta('meta[name="description"]', 'content', DEFAULT_DESCRIPTION);
  getMeta('meta[property="og:title"]', 'content', 'DriveBC');
  getMeta('meta[property="og:description"]', 'content', DEFAULT_DESCRIPTION);
  getMeta('meta[property="og:url"]', 'content', window.location.origin);
  document.head.querySelector('link[rel="canonical"]')?.remove();
}
