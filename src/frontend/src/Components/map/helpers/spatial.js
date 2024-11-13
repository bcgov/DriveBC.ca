// Map & geospatial imports
import * as turf from '@turf/turf';
import Flatbush from 'flatbush';

// Route filtering and ordering
export const populateRouteProjection = (data, route) => {
  // Deep copy to avoid direct state mutation
  const copiedData = structuredClone(data);

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
    const coords = getMidPoint(item.location);

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

export const filterByRoute = (data, route, extraToleranceMeters, populateProjection) => {
  if (!route || !data || data.length === 0) {
    return data;
  }

  const lineCoords = Array.isArray(route.route) ? route.route : route.route.coordinates[0];
  const routeLineString = turf.lineString(lineCoords);
  const bufferedRouteLineString = turf.buffer(routeLineString, 150, {units: 'meters'});
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

  // Narrow down the results to only include intersections along the linestring
  const intersectingData = dataInBBox.filter(entry => {
    if (entry.location.type == "Point") {
      const coords = entry.location.coordinates;

      // 10m default tolerance
      const dataPoint = turf.buffer(
        turf.point(coords),
        (extraToleranceMeters ? extraToleranceMeters : 10), {units: 'meters'}
      );

      return turf.booleanIntersects(dataPoint, bufferedRouteLineString);

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

export const getMidPoint = (location) => {
  // Return point coords if location is a point
  if (location.type === "Point") {
    return location.coordinates;
  }

  // Create turf ls from location coordinates
  const line = turf.lineString(location.coordinates);

  // Calculate the length of the LineString
  const length = turf.length(line);

  // Find the midpoint distance
  const midpointDistance = length / 2;

  // Find and return the point coords at the midpoint distance
  const midpoint = turf.along(line, midpointDistance);
  return midpoint.geometry.coordinates;
}
