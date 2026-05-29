// External imports
import cloneDeep from 'lodash/cloneDeep';

// Map & geospatial imports
import { LineString, Point, Polygon } from "ol/geom";
import { lineString, point, multiPolygon, polygon } from '@turf/helpers';
import length from '@turf/length';
import lineSlice from '@turf/line-slice';
import buffer from '@turf/buffer';
import booleanIntersects from '@turf/boolean-intersects';
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import destination from '@turf/destination';
import along from '@turf/along';
import centroid from '@turf/centroid';

import Flatbush from 'flatbush';
import GeoJSON from 'ol/format/GeoJSON';

// Route filtering and ordering
export const populateRouteProjection = (data, route) => {
  // Deep copy to avoid direct state mutation
  const copiedData = typeof structuredClone === 'function' ? structuredClone(data) : cloneDeep(data);

  // Reference route start point/ls
  const lineCoords = Array.isArray(route.route) ? route.route : route.route.coordinates[0];
  const routeLs = lineString(lineCoords);
  const startPoint = point(lineCoords[0]);

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
    const closestPoint = point(closestCoords);

    // Find and save the distance along the route
    const distanceAlongLine = length(lineSlice(startPoint, closestPoint, routeLs), { units: 'meters' });
    copiedData[i].route_projection = distanceAlongLine;
  });

  return copiedData;
};

export const filterAdvisoryByRoute = (data, route) => {
  if (!route) {
    return data;
  }

  const lineCoords = Array.isArray(route.route) ? route.route : route.route.coordinates[0];
  const routeLineString = lineString(lineCoords);
  const bufferedRouteLineString = buffer(routeLineString, 150, {units: 'meters'});
  const filteredAdvisoryList = [];
  data.forEach(advisory =>{
    if (booleanIntersects(bufferedRouteLineString, multiPolygon(advisory.geometry.coordinates))) {
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
  const routeLineString = lineString(lineCoords);
  const bufferedRouteLineString = buffer(routeLineString, extraToleranceMeters ? 150 + extraToleranceMeters : 150, {units: 'meters'});

  // Initialize index and add data
  const routeBBox = bbox(routeLineString);
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
      const entryLs = lineString(coords);
      const entryBbox = bbox(entryLs);
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
      return booleanPointInPolygon(point(coords), bufferedRouteLineString);

    } else {
      const coords = entry.location.coordinates;
      const dataLs = lineString(coords);
      return booleanIntersects(dataLs, bufferedRouteLineString);
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

// Compute offset coordinates for a single overlapping point
function offsetCoordinates(coords, index, overlaps, resolution) {
  const baseDistance = 0.066;
  const scale = Math.pow(resolution / 4.77, 0.8);
  const distance = baseDistance * scale;

  const angle = 360 / overlaps;
  const bearing = angle * index;

  const turfPoint = point(coords);
  const destinationPoint = destination(turfPoint, distance, bearing, { units: 'kilometers' });
  return destinationPoint.geometry.coordinates;
}

// Collect all point features from loaded map layers, then group nearby
// ones using a Flatbush spatial index. Returns an object of overlap groups
// keyed by a locationIndex string, each containing { id, feature } entries.
export const groupNearbyFeatures = (mapLayers, toleranceMeters = 50) => {
  const pending = [];
  const seenIds = new Set();
  for (const [key, layer] of Object.entries(mapLayers.current)) {
    if (!layer || key.endsWith('Lines') || key === 'advisoriesLayer' || key === 'routeLayer') continue;

    const projection = layer.getSource().getProjection()?.getCode() || 'EPSG:3857';
    for (const feature of layer.getSource().getFeatures()) {
      if (feature.getGeometry().getType() !== 'Point') continue;

      const id = feature.getId();
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      // Stores original EPSG:4326 coordinates on each feature so that subsequent
      // calls (after polling) always group based on the true position, not an
      // already-offset geometry.
      let coords = feature.get('_originalCoords');
      if (!coords) {
        coords = feature.getGeometry().clone().transform(projection, 'EPSG:4326').getCoordinates();
        feature.set('_originalCoords', coords);
      }

      pending.push({ coords, id, feature });
    }
  }

  if (pending.length === 0) return {};

  const groups = {};
  const toleranceDeg = toleranceMeters / 111320;

  const index = new Flatbush(pending.length);
  for (const { coords } of pending) {
    index.add(coords[0], coords[1], coords[0], coords[1]);
  }
  index.finish();

  const assigned = new Set();

  for (let i = 0; i < pending.length; i++) {
    if (assigned.has(i)) continue;

    const { coords } = pending[i];
    const neighborIndices = index.search(
      coords[0] - toleranceDeg, coords[1] - toleranceDeg,
      coords[0] + toleranceDeg, coords[1] + toleranceDeg,
    );

    const locationIndex = coords[0].toFixed(4) + ',' + coords[1].toFixed(4);
    groups[locationIndex] = [];

    for (const idx of neighborIndices) {
      if (assigned.has(idx)) continue;
      assigned.add(idx);

      const entry = pending[idx];
      groups[locationIndex].push({ id: entry.id, feature: entry.feature });
      entry.feature.set('locationIndex', locationIndex);
    }

    // Sort features by id to ensure consistent ordering
    groups[locationIndex].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  return groups;
}

// Apply offsets to all overlapping feature groups.
// Called after groupNearbyFeatures on load, and again on zoom change.
export const applyOverlapOffsets = (overlapGroups, mapView) => {
  const resolution = mapView.current.getResolution();
  const projection = mapView.current.getProjection().getCode();

  // Map not visible, return
  if (resolution <= 0) {
    return;
  }

  for (const [, entries] of Object.entries(overlapGroups)) {
    for (let i = 0; i < entries.length; i++) {
      // Resets every feature to its original position first, then offsets
      // entries[1..n] in groups with more than one feature.
      const original = entries[i].feature.get('_originalCoords');
      if (original) {
        const restored = new Point(original);
        restored.transform('EPSG:4326', projection);
        entries[i].feature.setGeometry(restored);
      }
    }

    if (entries.length <= 1) continue;

    const original = entries[0].feature.get('_originalCoords');
    if (!original) continue;

    for (let i = 1; i < entries.length; i++) {
      const coords = offsetCoordinates(original, i, entries.length - 1, resolution);
      const newGeometry = new Point(coords);
      newGeometry.transform('EPSG:4326', projection);
      entries[i].feature.setGeometry(newGeometry);
    }
  }
}

export const getMidPoint = (mapContext, location) => {
  // Return point coords if location is a point
  if (location.type === "Point") {
    return location.coordinates;

  // Return midpoint for lines
  } else if (location.type === "LineString") {
    // Create turf ls from location coordinates
    const line = lineString(location.coordinates);

    // Calculate the length of the LineString
    const lineLen = length(line);

    // Find the midpoint distance
    const midpointDistance = lineLen / 2;

    // Find and return the point coords at the midpoint distance
    const midpoint = along(line, midpointDistance);
    return midpoint.geometry.coordinates;

  // Return centroid for multipolygons
  } else {
    const geometry = location.type === "MultiPolygon" ? multiPolygon(location.coordinates) : polygon(location.coordinates);
    const geometryCentroid = centroid(geometry);
    return geometryCentroid.geometry.coordinates;
  }
}
