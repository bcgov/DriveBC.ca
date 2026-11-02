// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  getCmsContentSeoDescription,
  getMapFeatureRoute,
  getMapFeatureSeoMetadata,
  getPageSeoDescription,
  isMapFeatureNoindex,
  isMapFeatureSelected,
  resetSeoMetadata,
  setMapFeatureSeoMetadata,
  setPageSeoDescription,
  setSeoNoindex,
} from './seo';

describe('SEO metadata', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.title = '';
    window.history.replaceState({}, '', '/');
  });

  it('uses the camera caption, readable title, and clean canonical URL', () => {
    const metadata = getMapFeatureSeoMetadata(
      'cameras',
      {
        id: 760,
        name: 'Kootenay Pass',
        highway_display: '3',
        caption: '<p>View <strong>road conditions</strong> at the pass.</p>',
      },
      'https://dev.drivebc.ca/',
    );

    expect(metadata).toEqual({
      title: 'Kootenay Pass - Highway 3 Camera | DriveBC',
      description: 'View road conditions at the pass.',
      canonicalUrl: 'https://dev.drivebc.ca/cameras/760',
    });
  });

  it('updates document metadata and removes camera metadata when reset', () => {
    document.head.innerHTML = `
      <meta name="description">
      <meta property="og:title">
      <meta property="og:description">
      <meta property="og:url">
    `;

    setMapFeatureSeoMetadata('cameras', {
      id: 760,
      name: 'Kootenay Pass',
      caption: 'Live camera view',
    });

    expect(document.title).toBe('Kootenay Pass | DriveBC');
    expect(document.querySelector('meta[name="description"]').content).toBe(
      'Live camera view',
    );
    expect(document.querySelector('link[rel="canonical"]').href).toBe(
      `${window.location.origin}/cameras/760`,
    );
    expect(document.querySelector('meta[property="og:url"]').content).toBe(
      `${window.location.origin}/cameras/760`,
    );

    resetSeoMetadata();

    expect(document.title).toBe('DriveBC');
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]').content).toBe(
      window.location.origin,
    );
  });

  it('uses a plain-text fallback description when the camera has no caption', () => {
    const metadata = getMapFeatureSeoMetadata(
      'cameras',
      { id: 760, name: 'Kootenay Pass', highway: '3' },
      'https://dev.drivebc.ca',
    );

    expect(metadata.description).toBe(
      'View the live highway camera for Kootenay Pass on Highway 3 with DriveBC.',
    );
  });

  it('uses clean canonical URLs for ferries and rest stops', () => {
    const inlandFerry = getMapFeatureSeoMetadata(
      'ferry',
      { id: 41, route_name: 'Glade Cable Ferry' },
      'https://dev.drivebc.ca',
    );
    const coastalFerry = getMapFeatureSeoMetadata(
      'coastal-ferry',
      { id: 42, name: 'Island Ferry', routes: [{ name: 'Route 1' }] },
      'https://dev.drivebc.ca',
    );
    const largeRestStop = getMapFeatureSeoMetadata(
      'rest-stop',
      {
        id: 17,
        properties: {
          REST_AREA_NAME: 'OOTISCHENIA',
          HIGHWAY_NUMBER: '3',
          DISTANCE_FROM_MUNICIPALITY: '7.0KM EAST OF CASTLEGAR',
        },
      },
      'https://dev.drivebc.ca/',
    );

    expect(inlandFerry.canonicalUrl).toBe('https://dev.drivebc.ca/ferry/41');
    expect(coastalFerry.canonicalUrl).toBe(
      'https://dev.drivebc.ca/coastal-ferry/42',
    );
    expect(largeRestStop.canonicalUrl).toBe(
      'https://dev.drivebc.ca/rest-stop/17',
    );
    expect(largeRestStop.title).toBe('Ootischenia Rest Stop | DriveBC');
    expect(largeRestStop.description).toBe(
      'Ootischenia on Highway 3, 7.0km East of Castlegar. Rest area information from DriveBC.',
    );
  });

  it('uses the station identity and canonical URL for weather', () => {
    const metadata = getMapFeatureSeoMetadata(
      'roadside-weather',
      {
        id: 8,
        weather_station_name: 'Hope Airport',
        location_description: 'Near Hope, British Columbia',
      },
      'https://dev.drivebc.ca',
    );

    expect(metadata.title).toBe('Hope Airport Roadside Weather | DriveBC');
    expect(metadata.description).toBe('Near Hope, British Columbia');
    expect(metadata.canonicalUrl).toBe(
      'https://dev.drivebc.ca/roadside-weather/8',
    );
  });

  it('adds the correct weather category to regional and high-elevation titles', () => {
    expect(
      getMapFeatureSeoMetadata(
        'regional-weather',
        { id: 3, name: 'Castlegar' },
        'https://dev.drivebc.ca',
      ).title,
    ).toBe('Castlegar Regional Weather | DriveBC');
    expect(
      getMapFeatureSeoMetadata(
        'regional-weather',
        { id: 3, name: 'Castlegar' },
        'https://dev.drivebc.ca',
      ).canonicalUrl,
    ).toBe('https://dev.drivebc.ca/regional-weather/3');
    expect(
      getMapFeatureSeoMetadata(
        'high-elevation-weather',
        { id: 4, hwyDescription: 'Paulson Summit to Kootenay Pass' },
        'https://dev.drivebc.ca',
      ).title,
    ).toBe('Paulson Summit to Kootenay Pass High Elevation Weather | DriveBC');
    expect(
      getMapFeatureSeoMetadata(
        'high-elevation-weather',
        { id: 4, hwyDescription: 'Paulson Summit to Kootenay Pass' },
        'https://dev.drivebc.ca',
      ).canonicalUrl,
    ).toBe('https://dev.drivebc.ca/high-elevation-weather/4');
  });

  it('provides custom descriptions for public landing pages', () => {
    expect(getPageSeoDescription('/')).toBe(
      'Check real-time BC highway road conditions, traffic delays, webcams, and weather advisories across British Columbia.',
    );
    expect(getPageSeoDescription('/cameras')).toBe(
      'View highway webcams and real-time traffic camera feeds across British Columbia highways.',
    );
    expect(getPageSeoDescription('/delays')).toBe(
      'Get updates on BC highway closures, construction, accidents, and travel delays.',
    );
    expect(getPageSeoDescription('/advisories')).toBe(
      'Check active BC travel advisories, flood warnings, winter driving alerts, and emergency road closures.',
    );
    expect(getPageSeoDescription('/bulletins')).toContain(
      'latest DriveBC bulletins',
    );
    expect(getPageSeoDescription('/problems')).toContain('Report highway');
  });

  it('updates standard and Open Graph page descriptions together', () => {
    document.head.innerHTML = `
      <meta name="description">
      <meta property="og:description">
    `;

    setPageSeoDescription('Page-specific description.');

    expect(document.querySelector('meta[name="description"]').content).toBe(
      'Page-specific description.',
    );
    expect(
      document.querySelector('meta[property="og:description"]').content,
    ).toBe('Page-specific description.');
  });

  it('uses CMS teaser text for bulletin and advisory descriptions', () => {
    expect(
      getCmsContentSeoDescription({
        teaser: 'Advisory tagline.',
        rendered_body: '<p>Body text should not replace the teaser.</p>',
      }),
    ).toBe('Advisory tagline.');
    expect(
      getCmsContentSeoDescription({
        teaser: '',
        rendered_body: '<p>Body fallback for legacy content.</p>',
      }),
    ).toBe('Body fallback for legacy content.');
  });

  it('detects map panel routes and selected map features', () => {
    expect(getMapFeatureRoute('/coastal-ferry/42')).toEqual({
      path: 'coastal-ferry',
      id: '42',
      type: 'ferry',
    });
    expect(getMapFeatureRoute('/cameras')).toBeNull();
    expect(getMapFeatureRoute('/advisories/some-advisory')).toBeNull();

    const noParams = new URLSearchParams();
    const featureParams = new URLSearchParams({ type: 'event', id: '1' });
    expect(isMapFeatureSelected('/rest-stop/17', noParams)).toBe(true);
    expect(isMapFeatureSelected('/', featureParams)).toBe(true);
    expect(isMapFeatureSelected('/', noParams)).toBe(false);
    expect(isMapFeatureSelected('/delays', featureParams)).toBe(false);
  });

  it('marks only non-allowlisted map panels as noindex', () => {
    const params = query => new URLSearchParams(query);
    for (const type of ['event', 'borderCrossing', 'wildfire']) {
      expect(isMapFeatureNoindex('/', params({ type, id: '1' }))).toBe(true);
    }
    for (const type of ['camera', 'restStop', 'ferry', 'localWeather', 'regionalWeather', 'hef']) {
      expect(isMapFeatureNoindex('/', params({ type, id: '1' }))).toBe(false);
    }
    expect(isMapFeatureNoindex('/cameras/1', params())).toBe(false);
    expect(isMapFeatureNoindex('/', params())).toBe(false);

    setSeoNoindex(true);
    expect(document.head.querySelector('meta[name="robots"]').content).toBe('noindex');
    setSeoNoindex(false);
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
