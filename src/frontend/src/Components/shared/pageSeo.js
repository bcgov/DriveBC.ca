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

export function getPageSeoDescription(pathname, hasSelectedMapFeature = false) {
  if (pathname === '/' && hasSelectedMapFeature) {
    return null;
  }

  if (
    /^\/(cameras|rest-stop|ferry|coastal-ferry|roadside-weather|regional-weather|high-elevation-weather)\//.test(
      pathname,
    )
  ) {
    return null;
  }

  return PAGE_DESCRIPTIONS[pathname] || DEFAULT_DESCRIPTION;
}
