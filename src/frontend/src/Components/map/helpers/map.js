// Internal imports
import { redLocationMarkup, setLocationPin } from './';

// Map & geospatial imports
import { fromLonLat, transformExtent } from 'ol/proj';
import * as turf from '@turf/turf';

// Map transformation
export const transformFeature = (feature, sourceCRS, targetCRS) => {
  const clone = feature.clone();
  clone.getGeometry().transform(sourceCRS, targetCRS);
  return clone;
};

// Zoom and pan
export const fitMap = (route, mapView) => {
  const routeBbox = turf.bbox(turf.lineString(route));
  const routeExtent = transformExtent(routeBbox, 'EPSG:4326', 'EPSG:3857');

  if (mapView.current) {
    mapView.current.fit(routeExtent, { duration: 1000 });
  }
}

export const setZoomPan = (mapView, zoom, panCoords) => {
  if (!mapView.current) {
    return;
  }

  const args = {
    duration: 1000
  };

  if (zoom) {
    args.zoom = zoom;
  }

  if (panCoords) {
    args.center = panCoords;
  }

  mapView.current.animate(args);
};

export const zoomIn = (mapView) => {
  if (!mapView.current) {
    return;
  }

  setZoomPan(mapView, mapView.current.getZoom() + 1);
}

export const zoomOut = (mapView) => {
  if (!mapView.current) {
    return;
  }

  setZoomPan(mapView, mapView.current.getZoom() - 1);
}

export const toggleMyLocation = (mapRef, mapView) => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        if (
          position.coords.longitude <= -113.7 &&
          position.coords.longitude >= -139.3 &&
          position.coords.latitude <= 60.1 &&
          position.coords.latitude >= 48.2
        ) {
          setZoomPan(mapView, 9, fromLonLat([longitude, latitude]));
          setLocationPin([longitude, latitude], redLocationMarkup, mapRef);
        } else {
          // set my location to the center of BC for users outside of BC
          setZoomPan(mapView, 9, fromLonLat([-126.5, 54.2]));
          setLocationPin([-126.5, 54.2], redLocationMarkup, mapRef);
        }
      },
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          // The user has blocked location access
          console.error('Location access denied by user.', error);
        } else {
          // Zoom out and center to BC if location not available
          setZoomPan(mapView, 9, fromLonLat([-126.5, 54.2]));
        }
      },
    );
  }
}

export const calculateCenter = (referenceData) => {
  return Array.isArray(referenceData.location.coordinates[0])
    ? fromLonLat(
        referenceData.location.coordinates[
          Math.floor(referenceData.location.coordinates.length / 2)
        ],
      )
    : fromLonLat(referenceData.location.coordinates);
}
