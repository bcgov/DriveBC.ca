// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  getAdvisorySeoDescription,
  getBulletinSeoDescription,
  getCmsContentSeoDescription,
  getMapFeatureRoute,
  getMapPanelSearchParams,
  hasMapFeatureRouteMismatch,
  getMapFeatureSeoMetadata,
  getPageSeoDescription,
  isMapFeatureNoindex,
  isMapFeatureSelected,
  resetSeoMetadata,
  setMapFeatureSeoMetadata,
  setPageSeoDescription,
  setPageSeoTitle,
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
        caption:
          '<p>Highway 5 at the <strong>Great Bear Snowshed</strong>, looking north.</p>',
      },
      'https://dev.drivebc.ca/',
    );

    expect(metadata).toEqual({
      title: 'Kootenay Pass - Highway 3 Camera | DriveBC',
      description:
        'Highway webcam on Highway 5 at the Great Bear Snowshed, looking north.',
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
      'Highway webcam: Live camera view',
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

  it('keeps the Open Graph title in sync with the document title', () => {
    document.head.innerHTML = '<meta property="og:title">';

    setPageSeoTitle('Closures and Delays | DriveBC');

    expect(document.title).toBe('Closures and Delays | DriveBC');
    expect(document.querySelector('meta[property="og:title"]').content).toBe(
      document.title,
    );
  });

  it('uses a plain-text fallback description when the camera has no caption', () => {
    const metadata = getMapFeatureSeoMetadata(
      'cameras',
      { id: 760, name: 'Kootenay Pass', highway: '3' },
      'https://dev.drivebc.ca',
    );

    expect(metadata.description).toBe(
      'Highway webcam for Kootenay Pass on Highway 3.',
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
          REST_AREA_NAME: 'BULKLEY VIEW',
          HIGHWAY_NUMBER: '16',
          DISTANCE_FROM_MUNICIPALITY: '4.5KM EAST OF TELKWA',
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
    expect(largeRestStop.title).toBe('Bulkley View Rest Stop | DriveBC');
    expect(largeRestStop.description).toBe(
      'Rest area at Bulkley View on Highway 16, 4.5 km East of Telkwa',
    );
  });

  it('uses the station identity and canonical URL for weather', () => {
    const metadata = getMapFeatureSeoMetadata(
      'roadside-weather',
      {
        id: 8,
        weather_station_name: 'Hope Airport',
        location_description: 'E side of Hwy 1, South of Jackass summit',
      },
      'https://dev.drivebc.ca',
    );

    expect(metadata.title).toBe('Hope Airport Roadside Weather | DriveBC');
    expect(metadata.description).toBe(
      'Weather at E side of Hwy 1, South of Jackass summit',
    );
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
      'Check real-time BC highway road conditions, traffic delays, webcams, and weather information across British Columbia.',
    );
    expect(getPageSeoDescription('/cameras')).toBe(
      'View highway webcams and real-time traffic camera feeds across British Columbia highways.',
    );
    expect(getPageSeoDescription('/delays')).toBe(
      'Get updates on BC highway closures, construction, accidents, and travel delays.',
    );
    expect(getPageSeoDescription('/advisories')).toBe(
      'Check active BC travel advisories and emergency closures.',
    );
    expect(getPageSeoDescription('/bulletins')).toContain(
      'seasonal travel updates',
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

  it('labels advisory and bulletin descriptions', () => {
    expect(
      getAdvisorySeoDescription({
        teaser: 'See if this works after the switch',
      }),
    ).toBe('Advisory: see if this works after the switch');
    expect(
      getBulletinSeoDescription({
        title: 'Test Bulletin 4 - Testing the notification-major update',
      }),
    ).toBe(
      'Bulletin: Test Bulletin 4 - Testing the notification-major update Bulletin',
    );
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

  it('detects when a canonical map route no longer matches the selected panel', () => {
    const params = query => new URLSearchParams(query);

    expect(
      hasMapFeatureRouteMismatch(
        '/rest-stop/247882',
        params('type=localWeather&id=1943127'),
      ),
    ).toBe(true);
    expect(
      hasMapFeatureRouteMismatch(
        '/cameras/1136',
        params('type=localWeather&id=1943127'),
      ),
    ).toBe(true);
    expect(
      hasMapFeatureRouteMismatch(
        '/cameras/1136',
        params('type=camera&id=1137'),
      ),
    ).toBe(false);
    expect(
      hasMapFeatureRouteMismatch(
        '/rest-stop/247882',
        params('type=restStop&id=247882'),
      ),
    ).toBe(false);
    expect(
      hasMapFeatureRouteMismatch(
        '/rest-stop/247882',
        params('type=largeRestStop&id=247882'),
      ),
    ).toBe(false);
    expect(
      hasMapFeatureRouteMismatch(
        '/coastal-ferry/2505855',
        params('type=ferry&id=2505855&coastal=true'),
      ),
    ).toBe(false);
    expect(
      hasMapFeatureRouteMismatch(
        '/coastal-ferry/2505855',
        params('type=ferry&id=2505855'),
      ),
    ).toBe(true);
  });

  it('removes camera-only query state after switching to another panel type', () => {
    expect(
      getMapPanelSearchParams(
        '?type=localWeather&id=1943127&camIndex=2&pan=1,2',
      ).toString(),
    ).toBe('type=localWeather&id=1943127&pan=1%2C2');
    expect(
      getMapPanelSearchParams('?type=camera&id=1136&camIndex=2').toString(),
    ).toBe('type=camera&id=1136&camIndex=2');
    expect(
      getMapPanelSearchParams('?camIndex=2&pan=1,2').toString(),
    ).toBe('camIndex=2&pan=1%2C2');
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
