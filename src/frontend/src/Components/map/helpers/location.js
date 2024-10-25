import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay.js';

// Location pins
export const blueLocationMarkup = `
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg" id="svg-container">
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="40%" style="stop-color:#f32947;stop-opacity:0.5" />
        <stop offset="40%" style="stop-color:#ed6f82;stop-opacity:0.5" />
      </linearGradient>
    </defs>
    <circle id="circle1" cx="44" cy="44" r="44" fill="url(#gradient1)"/>
    <defs>
      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="100%" style="stop-color:#f32947;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ed6f82;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="44" cy="44" r="16" fill="url(#gradient2)" stroke="white" stroke-width="2" />
  </svg>
`;

export const redLocationMarkup = `
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg" id="svg-container">
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="40%" style="stop-color:#2790F3;stop-opacity:0.5" />
        <stop offset="40%" style="stop-color:#7496EC;stop-opacity:0.5" />
      </linearGradient>
    </defs>
    <circle id="circle1" cx="44" cy="44" r="44" fill="url(#gradient1)"/>
    <defs>
      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="100%" style="stop-color:#2970F3;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#7496EC;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="44" cy="44" r="16" fill="url(#gradient2)" stroke="white" stroke-width="2" />
  </svg>
`;


export const redLocationToMarkup = `
  <svg 
    aria-hidden="true" 
    focusable="false" 
    data-prefix="fas" 
    data-icon="location-dot" 
    class="svg-inline--fa fa-location-dot" 
    role="img" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 384 512">
    
    <path 
      d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" 
      fill="red" 
      stroke="white" 
      stroke-width="20" 
    ></path>
    
    <path 
      d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" 
      fill="none" 
      stroke="white"
    ></path>
    
  </svg>
`;

export const setLocationPin = (coordinates, svgMarkup, mapRef, pinRef) => {
  const svgImage = new Image();
  svgImage.src =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);
  svgImage.alt = 'my location pin';

  // Create an overlay for the marker
  const pinOverlay = new Overlay({
    position: fromLonLat(coordinates),
    positioning: 'center-center',
    element: svgImage,
    stopEvent: false, // Allow interactions with the overlay content
  });

  if (pinRef) {
    pinRef.current = pinOverlay;
  }

  mapRef.current.addOverlay(pinOverlay);
  mapRef.current.on('moveend', function (event) {
    const newZoom = mapRef.current.getView().getZoom();
    // Calculate new marker size based on the zoom level
    const newSize = 44 * (newZoom / 10);
    svgImage.style.width = newSize + 'px';
    svgImage.style.height = newSize + 'px';
  });
}
