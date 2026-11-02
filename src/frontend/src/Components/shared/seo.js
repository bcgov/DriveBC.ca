import { toTitleCase } from './textFormatting';

const DEFAULT_TITLE = 'DriveBC';
const DEFAULT_DESCRIPTION =
  'Check real-time BC road conditions, closures, highway webcams, and delays with DriveBC.';

export const PAGE_DESCRIPTIONS = {
  '/': 'Check real-time BC highway road conditions, traffic delays, webcams, and weather advisories across British Columbia.',
  '/cameras':
    'View highway webcams and real-time traffic camera feeds across British Columbia highways.',
  '/delays':
    'Get updates on BC highway closures, construction, accidents, and travel delays.',
  '/chain-ups':
    'Check current commercial vehicle chain-up requirements and locations across British Columbia.',
  '/advisories':
    'Check active BC travel advisories, flood warnings, winter driving alerts, and emergency road closures.',
  '/bulletins':
    'Read the latest DriveBC bulletins about highway conditions, planned work, and travel information across British Columbia.',
  '/problems':
    'Report highway, bridge, electrical, or website problems to help keep British Columbia roads safe and information up to date.',
  '/feedback':
    'Send DriveBC feedback, suggestions, or reports about problems with the website.',
  '/highway-problem':
    'Report potholes, highway or bridge damage, drainage issues, fallen rocks, and other road maintenance problems in British Columbia.',
  '/road-electrical-problem':
    'Report problems with highway signs, street lights, pedestrian lighting, and traffic signals in British Columbia.',
};

// Map panel routes (/<path>/:id) and their map feature types; paths match backend sitemaps
export const MAP_FEATURE_ROUTES = {
  cameras: 'camera',
  'rest-stop': 'restStop',
  ferry: 'ferry',
  'coastal-ferry': 'ferry',
  'roadside-weather': 'localWeather',
  'regional-weather': 'regionalWeather',
  'high-elevation-weather': 'hef',
};

export const getMapFeatureRoute = pathname => {
  const [, path, id] = pathname.match(/^\/([^/]+)\/([^/]+)/) || [];
  return MAP_FEATURE_ROUTES[path]
    ? { path, id, type: MAP_FEATURE_ROUTES[path] }
    : null;
};

// Open map panels set their own metadata
export const isMapFeatureSelected = (pathname, searchParams) =>
  Boolean(
    getMapFeatureRoute(pathname) ||
    (pathname === '/' && searchParams.get('type') && searchParams.get('id')),
  );

// DBC22-7651: only camera, rest stop, ferry and weather panels are indexed
export const isMapFeatureNoindex = (pathname, searchParams) =>
  isMapFeatureSelected(pathname, searchParams) &&
  !getMapFeatureRoute(pathname) &&
  !Object.values(MAP_FEATURE_ROUTES).includes(searchParams.get('type'));

export const getPageSeoDescription = pathname =>
  PAGE_DESCRIPTIONS[pathname] || DEFAULT_DESCRIPTION;

export const getCmsContentSeoDescription = content =>
  getPlainText(content?.teaser || content?.rendered_body).slice(0, 160) ||
  DEFAULT_DESCRIPTION;

const getPlainText = value =>
  value
    ? new DOMParser()
        .parseFromString(value, 'text/html')
        .body.textContent.replace(/\s+/g, ' ')
        .trim()
    : '';

const getMapFeatureSeoText = (path, feature) => {
  const properties = feature.properties || {};

  switch (path) {
    case 'cameras': {
      const name = getPlainText(feature.name) || 'Highway camera';
      const highway = getPlainText(feature.highway_display || feature.highway);
      const onHighway = highway ? ` on Highway ${highway}` : '';
      return {
        title: highway ? `${name} - Highway ${highway} Camera` : name,
        description:
          feature.caption ||
          `View the live highway camera for ${name}${onHighway} with DriveBC.`,
      };
    }
    case 'rest-stop': {
      const name = toTitleCase(
        getPlainText(properties.REST_AREA_NAME || 'Rest area'),
      );
      const highway = properties.HIGHWAY_NUMBER
        ? ` on Highway ${properties.HIGHWAY_NUMBER}`
        : '';
      const distance = properties.DISTANCE_FROM_MUNICIPALITY
        ? `, ${toTitleCase(properties.DISTANCE_FROM_MUNICIPALITY)}`
        : '';
      return {
        title: `${name} Rest Stop`,
        description: `${name}${highway}${distance}. Rest area information from DriveBC.`,
      };
    }
    case 'ferry':
    case 'coastal-ferry': {
      const name = getPlainText(
        feature.route_name || feature.name || 'Ferry service',
      );
      return {
        title: name,
        description:
          feature.route_description ||
          `Ferry service for ${name} in British Columbia.`,
      };
    }
    case 'roadside-weather': {
      const name = getPlainText(
        feature.weather_station_name || 'Roadside weather station',
      );
      return {
        title: `${name} Roadside Weather`,
        description:
          feature.location_description ||
          `Current road and weather information for ${name} from DriveBC.`,
      };
    }
    case 'regional-weather': {
      const name = getPlainText(feature.name || 'Regional weather');
      return {
        title: `${name} Regional Weather`,
        description: `Weather forecast and current conditions for ${name} from DriveBC.`,
      };
    }
    case 'high-elevation-weather': {
      const name = getPlainText(
        feature.hwyDescription || feature.name || 'High elevation weather',
      );
      return {
        title: `${name} High Elevation Weather`,
        description: `High elevation weather forecast for ${name} from DriveBC.`,
      };
    }
  }
};

export const getMapFeatureSeoMetadata = (path, feature, origin) => {
  const { title, description } = getMapFeatureSeoText(path, feature);
  return {
    title: `${title} | ${DEFAULT_TITLE}`,
    description: getPlainText(description).slice(0, 160) || DEFAULT_DESCRIPTION,
    canonicalUrl: `${origin.replace(/\/+$/, '')}/${path}/${feature.id}`,
  };
};

const setHeadTag = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    if (selector.startsWith('link')) {
      element = document.createElement('link');
      element.rel = 'canonical';
    } else {
      const [, key, name] = selector.match(/(name|property)="([^"]+)"/);
      element = document.createElement('meta');
      element.setAttribute(key, name);
    }
    document.head.append(element);
  }
  element.setAttribute(attribute, value);
};

export const setPageSeoDescription = description => {
  const plainText = getPlainText(description).slice(0, 160);
  setHeadTag('meta[name="description"]', 'content', plainText);
  setHeadTag('meta[property="og:description"]', 'content', plainText);
};

export const setMapFeatureSeoMetadata = (path, feature) => {
  const { title, description, canonicalUrl } = getMapFeatureSeoMetadata(
    path,
    feature,
    window.location.origin,
  );
  document.title = title;
  setPageSeoDescription(description);
  setHeadTag('meta[property="og:title"]', 'content', title);
  setHeadTag('meta[property="og:url"]', 'content', canonicalUrl);
  setHeadTag('link[rel="canonical"]', 'href', canonicalUrl);
};

export const setSeoNoindex = noindex => {
  if (noindex) {
    setHeadTag('meta[name="robots"]', 'content', 'noindex');
  } else {
    document.head.querySelector('meta[name="robots"]')?.remove();
  }
};

export const resetSeoMetadata = () => {
  document.title = DEFAULT_TITLE;
  setPageSeoDescription(DEFAULT_DESCRIPTION);
  setHeadTag('meta[property="og:title"]', 'content', DEFAULT_TITLE);
  setHeadTag('meta[property="og:url"]', 'content', window.location.origin);
  document.head.querySelector('link[rel="canonical"]')?.remove();
};
