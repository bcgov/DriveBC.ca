// External imports
import cloneDeep from 'lodash/cloneDeep';

// Map & geospatial imports
import { LineString, Point, Polygon } from "ol/geom";
import * as turf from '@turf/turf';
import Flatbush from 'flatbush';
import GeoJSON from 'ol/format/GeoJSON';

// Route filtering and ordering
export const populateRouteProjection = (data, route) => {
  // Deep copy to avoid direct state mutation
  const copiedData = typeof structuredClone === 'function' ? structuredClone(data) : cloneDeep(data);

  // Reference route start point/ls
  const lineCoords = Array.isArray(route.route) ? route.route : route.route.coordinates[0];
  const routeLs = turf.lineString(lineCoords);
  const startPoint = turf.point(lineCoords[0]);

  // Create a spatial index for the route line
  const spatialIndex = new Flatbush(lineCoords.length);
  lineCoords.forEach(([lng, lat]) => {
    spatialIndex.add(lng, lat, lng, lat);
  });
  spatialIndex.finish();

  // Calculate and store distance along reference line
  copiedData.forEach((item, i) => {
    const coords = getMidPoint(null, item.location ? item.location : item.geometry);

    // Find the closest point on the route using the spatial index
    const closestCoords = spatialIndex.neighbors(coords[0], coords[1], 1).map(idx => lineCoords[idx])[0];
    const closestPoint = turf.point(closestCoords);

    // Find and save the distance along the route
    const distanceAlongLine = turf.lineDistance(turf.lineSlice(startPoint, closestPoint, routeLs), { units: 'meters' });
    copiedData[i].route_projection = distanceAlongLine;
  });

  return copiedData;
};

export const filterAdvisoryByRoute = (data, route) => {
  if (!route) {
    return data;
  }

  const lineCoords = Array.isArray(route.route) ? route.route : route.route.coordinates[0];
  const routeLineString = turf.lineString(lineCoords);
  const bufferedRouteLineString = turf.buffer(routeLineString, 150, {units: 'meters'});
  const filteredAdvisoryList = [];
  data.forEach(advisory =>{
    if (turf.booleanIntersects(bufferedRouteLineString, turf.multiPolygon(advisory.geometry.coordinates))) {
      filteredAdvisoryList.push(advisory);
    }
  });

  return filteredAdvisoryList;
}

function getOLGeometry(location) {
  let geom;
  switch (location.type) {
    case 'Point':
      geom =  new Point(location.coordinates);
      break;
    case 'LineString':
      geom = new LineString(location.coordinates);
      break;
    case 'Polygon':
      geom = new Polygon(location.coordinates);
      break;
  }

  geom.transform('EPSG:4326', 'EPSG:3857');
  return geom;
}

function turfToOL(turfPolygon) {
  const geoJsonFormat = new GeoJSON();
  const feature = geoJsonFormat.readFeature(turfPolygon, {
    dataProjection: 'EPSG:4326', // Assuming the GeoJSON is in EPSG:4326
    featureProjection: 'EPSG:3857' // Desired projection for OpenLayers
  });

  return feature.getGeometry();
}

// with intersectsExtent and spatial index
export const filterByRoute = (data, route, extraToleranceMeters, populateProjection) => {
  if (!route || !data || data.length === 0) {
    return data;
  }

  const lineCoords = Array.isArray(route.route) ? route.route : route.route.coordinates[0];
  const routeLineString = turf.lineString(lineCoords);
  const bufferedRouteLineString = turf.buffer(routeLineString, 150, {units: 'meters'});

  // Initialize index and add data
  const routeBBox = turf.bbox(routeLineString);
  const spatialIndex = new Flatbush(data.length);
  data.forEach((entry) => {
    // Add points to the index with slight tolerance
    if (entry.location.type == "Point") {
      const coords = entry.location.coordinates;
      const pointRadius = 0.0001 * ((extraToleranceMeters ? extraToleranceMeters : 10) / 10); // 10m default tolerance
      spatialIndex.add(coords[0] - pointRadius, coords[1] - pointRadius, coords[0] + pointRadius, coords[1] + pointRadius);

    // Add linestrings to the index
    } else {
      const coords = entry.location.coordinates;
      const entryLs = turf.lineString(coords);
      const entryBbox = turf.bbox(entryLs);
      spatialIndex.add(entryBbox[0], entryBbox[1], entryBbox[2], entryBbox[3]);
    }
  });

  // Finish building the index
  spatialIndex.finish();

  // Query the index for features intersecting with the linestring
  const dataInBBox = [];
  spatialIndex.search(routeBBox[0], routeBBox[1], routeBBox[2], routeBBox[3], (idx) => {
    dataInBBox.push(data[idx]);
  });

  // Select all events that intersect with the route buffer (quick dirty filter that includes more records than needed)
  const olBufferedLs = turfToOL(bufferedRouteLineString);
  const dirtyFilteredData = dataInBBox.filter((feature) => {
    const olGeom = getOLGeometry(feature.location)
    const olExtent = olGeom.getExtent()
    return olBufferedLs.intersectsExtent(olExtent);
  });

  // Narrow down the results to only include intersections along the linestring
  const intersectingData = dirtyFilteredData.filter(entry => {
    if (entry.location.type == "Point") {
      const coords = entry.location.coordinates;
      return turf.booleanPointInPolygon(turf.point(coords), bufferedRouteLineString);

    } else {
      const coords = entry.location.coordinates;
      const dataLs = turf.lineString(coords);
      return turf.booleanIntersects(dataLs, bufferedRouteLineString);
    }
  });

  // Populate route projection for camera ordering
  if (populateProjection) {
    return populateRouteProjection(intersectingData, route);
  }

  return intersectingData;
}

export const compareRouteDistance = (route1, route2) => {
  if (!!route1 && !!route2) {
    return Math.abs(route1.distance - route2.distance) < 1;
  }
  return true;
}

const getPointCoords = (mapContext, coords) => {
  if (!mapContext.features) {
    mapContext.features = {};
  }

  if (!mapContext.features.events) {
    mapContext.features.events = {};
  }

  const locationIndex = coords[0] + ',' + coords[1];
  if (mapContext.features.events[locationIndex]) {
    // point exists, retrieve offset location instead
    return getPointCoords(mapContext, [coords[0] + 0.00176, coords[1]]);  // offset 0.00176 degrees (~200m) East

  } else {
    // point does not exist, record and return
    mapContext.features.events[locationIndex] = coords;
    return coords;
  }
}

export const getMidPoint = (mapContext, location) => {
  // Return point coords if location is a point
  if (location.type === "Point") {
    if (mapContext) {
      return getPointCoords(mapContext, location.coordinates);
    }

    return location.coordinates;
  }

  // Return midpoint for lines
  else if (location.type === "LineString") {
    // Create turf ls from location coordinates
    const line = turf.lineString(location.coordinates);

    // Calculate the length of the LineString
    const length = turf.length(line);

    // Find the midpoint distance
    const midpointDistance = length / 2;

    // Find and return the point coords at the midpoint distance
    const midpoint = turf.along(line, midpointDistance);
    return midpoint.geometry.coordinates;

  // Return centroid for multipolygons
  } else {
    const geometry = location.type === "MultiPolygon" ? turf.multiPolygon(location.coordinates) : turf.polygon(location.coordinates);
    const centroid = turf.centroid(geometry);
    return centroid.geometry.coordinates;
  }
}
