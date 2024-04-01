// Third party packages
import { lineString, bbox } from "@turf/turf";

// Map & geospatial imports
import { fromLonLat, transformExtent } from 'ol/proj';
import * as turf from '@turf/turf';
import Flatbush from 'flatbush';
import Overlay from 'ol/Overlay.js';

// Styling
import { closureStyles, eventStyles } from '../data/featureStyleDefinitions.js';

// Static assets
export const setEventStyle = (events, state) => {
  if (!Array.isArray(events)) { events = [events]; }

  events.forEach((event) => {
    const display_category = event.get('display_category');
    const is_closure = event.get('closed');
    const geometry = event.getGeometry().getType();

    if (geometry !== 'Point') { // Line segments
      const category = is_closure ? 'closure' : display_category;

      if (event.get('layerType') === 'webgl') {
        event.setProperties(eventStyles['segments'][category][state]);
      } else {
        event.setStyle(eventStyles['segments'][category][state]);
      }
    } else { // Points
      if (is_closure) {
        return event.setStyle(eventStyles['closures'][state]);
      }
      const severity = event.get('severity').toLowerCase();

      switch (display_category) {
        case 'futureEvents':
          return event.setStyle(eventStyles[
            severity === 'major' ? 'major_future_events' : 'future_events'
          ][state]);

        case 'roadConditions':
          return event.setStyle(eventStyles['road_conditions'][state]);

        default: {
          const type = event.get('event_type').toLowerCase();
          if (type === 'construction') {
            event.setStyle(eventStyles[
              severity === 'major' ? 'major_constructions' : 'constructions'
            ][state]);
          } else { // Other major/minor delays
            event.setStyle(eventStyles[
              severity === 'major' ? 'major_generic_delays' : 'generic_delays'
            ][state]);
          }
        }
      }
    }
  })
};


// Map transformation
export const transformFeature = (feature, sourceCRS, targetCRS) => {
  const clone = feature.clone();
  clone.getGeometry().transform(sourceCRS, targetCRS);
  return clone;
};

// Zoom and pan
export const fitMap = (route, mapView) => {
  const routeBbox = bbox(lineString(route));
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

export const filterByRoute = (data, route, extraToleranceMeters) => {
  if (!route) {
    return data;
  }

  const lineCoords = route.route;
  const routeLineString = turf.lineString(lineCoords);
  const bufferedRouteLineString = turf.buffer(routeLineString, 150, {units: 'meters'});
  const routeBBox = turf.bbox(routeLineString);

  const spatialIndex = new Flatbush(data.length);

  data.forEach((entry) => {
    // Add points to the index with slight tolerance
    if (entry.location.type == "Point") {
      const coords = entry.location.coordinates;
      const pointRadius = extraToleranceMeters ? 0.0001 * (extraToleranceMeters / 10) : 0.0001; // ~11m default tolerance
      spatialIndex.add(coords[0] - pointRadius, coords[1] - pointRadius, coords[0] + pointRadius, coords[1] + pointRadius);

    // Add linestrings to the index
    } else {
      const coords = entry.location.coordinates;
      const ls = turf.lineString(coords);
      const bbox = turf.bbox(routeLineString);
      spatialIndex.add(bbox[0], bbox[1], bbox[2], bbox[3]);
    }
  });

  // Finish building the index
  spatialIndex.finish();

  // Query the index for features intersecting with the linestring
  const dataInBBox = [];
  spatialIndex.search(routeBBox[0], routeBBox[1], routeBBox[2], routeBBox[3], (idx) => {
    dataInBBox.push(data[idx]);
  });

  // Narrow down the results to only include intersections along the linestring
  const intersectingData = dataInBBox.filter(entry => {
    if (entry.location.type == "Point") {
      const coords = entry.location.coordinates;
      let dataPoint = turf.point(coords);
      if (extraToleranceMeters) {
        dataPoint = turf.buffer(dataPoint, extraToleranceMeters, {units: 'meters'});
      }

      return turf.booleanIntersects(dataPoint, bufferedRouteLineString);

    } else {
      const coords = entry.location.coordinates;
      const dataLs = turf.lineString(coords);

      return turf.booleanIntersects(dataLs, routeLineString);
    }
  });

  return intersectingData;
}

export const compareRoutePoints = (routePoints, savedPoints) => {
  // Both are arrays of points, compare each point
  if (!!routePoints && !!savedPoints) {
    for (let i=0; i < routePoints.length; i++) {
      const rPoint = turf.point(routePoints[i]);
      const sPoint = turf.point(savedPoints[i]);

      // Return false if one of the points aren't equal
      if (!turf.booleanEqual(rPoint, sPoint)) {
        return false;
      }
    }

    // Return true if all points are equal
    return true;
  }

  // Direct comparison if not both of them are arrays of points
  return routePoints == savedPoints;
}
