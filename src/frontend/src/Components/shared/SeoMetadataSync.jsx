import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const detailPathPattern = /^\/(?:cameras\/\d+|rest-stops\/\d+|ferries\/(?:coastal\/)?\d+)\/?$/;
const defaultDescription = 'Check real-time BC road conditions, closures, highway webcams, and delays with DriveBC.';

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector);
  if (!value) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement('meta');
    if (selector.includes('property=')) {
      element.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
    } else {
      element.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
    }
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

function setCanonical(value) {
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!value) {
    canonical?.remove();
    return;
  }
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = value;
}

export default function SeoMetadataSync() {
  const location = useLocation();

  useEffect(() => {
    const pathIsDetail = detailPathPattern.test(location.pathname);
    const queryType = new URLSearchParams(location.search).get('type');
    const queryIsDetail = location.pathname === '/' &&
      ['camera', 'restStop', 'largeRestStop', 'ferry'].includes(queryType);
    if (!pathIsDetail && !queryIsDetail) {
      setMeta('meta[name="description"]', 'content', defaultDescription);
      setMeta('meta[property="og:title"]', 'content', 'DriveBC');
      setMeta('meta[property="og:description"]', 'content', defaultDescription);
      if (location.pathname === '/') {
        document.title = 'DriveBC';
        setCanonical('https://www.drivebc.ca/');
        setMeta('meta[property="og:url"]', 'content', 'https://www.drivebc.ca/');
      } else {
        setCanonical(null);
        setMeta('meta[property="og:url"]', 'content', null);
      }
      return;
    }

    let cancelled = false;
    fetch(`/seo-metadata${location.pathname}${location.search}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`SEO metadata request failed: ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        if (cancelled) return;
        const metadata = new DOMParser().parseFromString(html, 'text/html');
        const title = metadata.querySelector('title')?.textContent;
        if (title) document.title = title;
        setMeta('meta[name="description"]', 'content', metadata.querySelector('meta[name="description"]')?.content);
        setMeta('meta[property="og:title"]', 'content', metadata.querySelector('meta[property="og:title"]')?.content);
        setMeta('meta[property="og:description"]', 'content', metadata.querySelector('meta[property="og:description"]')?.content);

        const canonicalHref = metadata.querySelector('link[rel="canonical"]')?.href;
        setCanonical(canonicalHref);

        const ogUrl = metadata.querySelector('meta[property="og:url"]')?.content;
        setMeta('meta[property="og:url"]', 'content', ogUrl);
      })
      .catch((error) => {
        console.error('SEO metadata update failed', error);
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search]);

  return null;
}
