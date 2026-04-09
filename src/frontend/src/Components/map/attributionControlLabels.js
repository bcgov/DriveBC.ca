import { icon, toHtml } from '@fortawesome/fontawesome-svg-core';

/**
 * Build a span for OpenLayers Attribution label / collapseLabel (HTMLElement).
 * Class names match OpenLayers when className is ol-attribution attribution-control.
 *
 * @param {string} kind - 'expand' or 'collapse'
 * @param {object} iconDef - Font Awesome icon definition
 * @return {HTMLSpanElement} span with inlined SVG
 */
export function faAttributionToggleLabel(kind, iconDef) {
  const span = document.createElement('span');
  span.className = `ol-attribution attribution-control-${kind}`;
  const rendered = icon(iconDef, { classes: ['svg-inline--fa'] });
  span.innerHTML = toHtml(rendered.abstract[0]);
  return span;
}
