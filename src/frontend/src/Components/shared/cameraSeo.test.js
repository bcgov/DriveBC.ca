// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  getCameraSeoMetadata,
  resetCameraSeoMetadata,
  setCameraSeoMetadata,
} from './cameraSeo';

describe('camera SEO metadata', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.title = '';
    window.history.replaceState({}, '', '/');
  });

  it('uses the camera caption, readable title, and clean canonical URL', () => {
    const metadata = getCameraSeoMetadata(
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

    setCameraSeoMetadata(
      {
        id: 760,
        name: 'Kootenay Pass',
        caption: 'Live camera view',
      },
      'https://dev.drivebc.ca',
    );

    expect(document.title).toBe('Kootenay Pass | DriveBC');
    expect(document.querySelector('meta[name="description"]').content).toBe(
      'Live camera view',
    );
    expect(document.querySelector('link[rel="canonical"]').href).toBe(
      'https://dev.drivebc.ca/cameras/760',
    );
    expect(document.querySelector('meta[property="og:url"]').content).toBe(
      'https://dev.drivebc.ca/cameras/760',
    );

    resetCameraSeoMetadata();

    expect(document.title).toBe('DriveBC');
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]').content).toBe(
      window.location.origin,
    );
  });

  it('uses a plain-text fallback description when the camera has no caption', () => {
    const metadata = getCameraSeoMetadata(
      { id: 760, name: 'Kootenay Pass', highway: '3' },
      'https://dev.drivebc.ca',
    );

    expect(metadata.description).toBe(
      'View the live highway camera for Kootenay Pass on Highway 3 with DriveBC.',
    );
  });
});
