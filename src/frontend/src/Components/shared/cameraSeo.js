const DEFAULT_DESCRIPTION =
  'Check real-time BC road conditions, closures, highway webcams, and delays with DriveBC.';

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

export function resetCameraSeoMetadata() {
  document.title = 'DriveBC';
  getMeta('meta[name="description"]', 'content', DEFAULT_DESCRIPTION);
  getMeta('meta[property="og:title"]', 'content', 'DriveBC');
  getMeta('meta[property="og:description"]', 'content', DEFAULT_DESCRIPTION);
  getMeta('meta[property="og:url"]', 'content', window.location.origin);
  document.head.querySelector('link[rel="canonical"]')?.remove();
}
