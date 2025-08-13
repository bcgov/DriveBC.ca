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
export const fitMap = (routes, mapView) => {
  // Only apply to map page when at least one route is returned
  if (!Array.isArray(routes) || routes.length === 0) {
    return;
  }

  // Not called in map, set pendingFit to true and return
  if (!mapView || !mapView.current) {
    localStorage.setItem("pendingFit", 'true');
    return;
  }

  // Initialize the combined bounding box with the first route's bounding box
  const combinedBbox = turf.bbox(turf.lineString(routes[0].route));

  // Iterate over the remaining routes and extend the combined bounding box
  for (let i = 1; i < routes.length; i++) {
    const routeBbox = turf.bbox(turf.lineString(routes[i].route));
    combinedBbox[0] = Math.min(combinedBbox[0], routeBbox[0]);
    combinedBbox[1] = Math.min(combinedBbox[1], routeBbox[1]);
    combinedBbox[2] = Math.max(combinedBbox[2], routeBbox[2]);
    combinedBbox[3] = Math.max(combinedBbox[3], routeBbox[3]);
  }

  // Transform the combined bounding box to the map's projection
  const routeExtent = transformExtent(combinedBbox, 'EPSG:4326', 'EPSG:3857');

  mapView.current.fit(routeExtent, { duration: 1000 });
  localStorage.setItem("pendingFit", 'false');
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

export const toggleMyLocation = (mapRef, mapView, setMyLocationLoading, setMyLocation, setShowLocationAccessError) => {
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

          // Fake feature for current location
          const myLocation = {
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "crs": {
                "type": "EPSG",
                "properties": {
                  "code": 4326
                }
              },
              "coordinates": [
                position.coords.longitude,
                position.coords.latitude
              ]
            },
            "label": "Current location"
          };

          setMyLocation(myLocation);
          setZoomPan(mapView, 9, fromLonLat([longitude, latitude]));
          setLocationPin([longitude, latitude], redLocationMarkup, mapRef);
          setMyLocationLoading(false);
        } else {
          // set my location to the center of BC for users outside of BC
          setZoomPan(mapView, 9, fromLonLat([-126.5, 54.2]));
          setLocationPin([-126.5, 54.2], redLocationMarkup, mapRef);
          setMyLocationLoading(false);
        }
      },
      error => {
        // The user has blocked location access
        if (error.code === error.PERMISSION_DENIED) {
          setShowLocationAccessError(true);
          setMyLocationLoading(false);

        } else {
          // Zoom out and center to BC if location not available
          setZoomPan(mapView, 9, fromLonLat([-126.5, 54.2]));
          setMyLocationLoading(false);
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

export const removeOverlays = (mapRef) => {
  // map not initialized i.e. in cam list, do nothing
  if (!mapRef || !mapRef.current) {
    return;
  }

  // Clone the overlays array to avoid issues when modifying the array during iteration
  const overlaysArray = [...mapRef.current.getOverlays().getArray()];

  overlaysArray.forEach((overlay) => {
    if (overlay.pinName === undefined) {
      mapRef.current.removeOverlay(overlay);
    }
  });
};
