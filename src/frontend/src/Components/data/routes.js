// External imports
import { point, multiLineString } from '@turf/turf';

// Internal imports
import { get } from "./helper.js";
import { getCookie } from "../../util";
import { removeFavRoute, pushFavRoute, updateSingleFavRoute } from '../../slices/userSlice';
import { updateSingleSearchedRoute, updateSelectedRoute } from "../../slices/routesSlice";
import { compareRouteDistance } from "../map/helpers";

export function getRoute(points, alternate=false) {
  const url = `${window.ROUTE_PLANNER}/directions.json`;

  const payload = {
    points: points,
    criteria: 'fastest',
//    outputSRS: 4036,
//    distanceUnit: 'km',
//    correctSide: true,
//    height: 5.1,
//    weight: 30001,
//    followTruckRoute: true,
//    partition: addressInput,
//    departure: '2019-02-28T11:36:00-08:00',
//    enable: 'td,gdf,ldf,tr,xc,tc',
//    roundTrip: false
  }

  if (alternate) {
    payload.criteria = 'shortest';

    const defaultGdf = '0.5,local:2,yield_lane:1,collector_major:2,collector_minor:2,ferry:2,arterial_minor:1,lane:1,arterial_major:0.7,resource:1.3,ramp:1,recreation:1.2,highway_major:0.5,strata:1,highway_minor:0.7,driveway:1,restricted:1.2,service:1.2,alleyway:1,';
    payload.gdf = (window.ALTERNATE_ROUTE_GDF && window.ALTERNATE_ROUTE_GDF !== 'undefined') ? window.ALTERNATE_ROUTE_GDF : defaultGdf;

    const defaultXingCost = '3.0,10.0,7.0,1.2';
    payload.xingCost = (window.ALTERNATE_ROUTE_XINGCOST && window.ALTERNATE_ROUTE_XINGCOST !== 'undefined') ? window.ALTERNATE_ROUTE_XINGCOST : defaultXingCost;

    const defaultTurnCost = '3.0,1.0,10.0,5.0';
    payload.turnCost = (window.ALTERNATE_ROUTE_TURNCOST && window.ALTERNATE_ROUTE_TURNCOST !== 'undefined') ? window.ALTERNATE_ROUTE_TURNCOST : defaultTurnCost;
  }

  return get(url, payload, {
    'apiKey': window.ROUTE_PLANNER_CLIENT_ID
  }).then((data) => data);
}

export const getFavoriteRoutes = async (headers = {}) => {
  const url = `${window.API_HOST}/api/users/routes/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json();
}


export const saveRoute = async (route, selectedRoute, nickname, routeMapImg, startLabel, endLabel, dispatch) => {
  const url = `${window.API_HOST}/api/users/routes/`;

  const body = {
    label: nickname,
    distance: route.distance,
    distance_unit: route.distanceUnit,
    start: startLabel,
    end: endLabel,
    start_point: route.start_point ? route.start_point : point(route.points[0]).geometry,
    end_point: route.end_point ? route.end_point : point(route.points[1]).geometry,
    thumbnail: routeMapImg,
    route: multiLineString([route.route]).geometry,
    criteria: route.criteria,
    searchTimestamp: route.searchTimestamp
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const savedRoute = await response.json();
    const payload = {...route, saved: true, id: savedRoute.id, label: nickname};
    if (selectedRoute && selectedRoute.id === route.id) {
      dispatch(updateSelectedRoute(payload));
    }

    dispatch(updateSingleSearchedRoute(payload));
    dispatch(pushFavRoute(savedRoute));

  } catch (error) {
    console.error('Error saving the camera:', error);
    throw error;
  }
}

export const removeRoute = async (route, selectedRoute, dispatch) => {
  const url = `${window.API_HOST}/api/users/routes/${route.id}/`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const routeCoords = Array.isArray(route.route) ? route.route : route.route.coordinates[0];
    const payload = {...route, id: null, saved: false, label: null, route: routeCoords};
    if (selectedRoute && selectedRoute.id === route.id) {
      dispatch(updateSelectedRoute(payload));
    }

    dispatch(updateSingleSearchedRoute(payload));
    dispatch(removeFavRoute(route.id));

  } catch (error) {
    console.error('Error saving the camera:', error);
    throw error;
  }
}

export const patchRoute = async (route, selectedRoute, dispatch, body) => {
  const url = `${window.API_HOST}/api/users/routes/${route.id}/`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const savedRoute = await response.json();
    const payload = {...route, ...savedRoute};
    if (selectedRoute && selectedRoute.id === route.id) {
      dispatch(updateSelectedRoute(payload));
    }

    dispatch(updateSingleSearchedRoute(payload));
    dispatch(updateSingleFavRoute(payload));

    return savedRoute;

  } catch (error) {
    console.error('Error saving the camera:', error);
    throw error;
  }
}

const compareCoordinates = (coord1, coord2) => {
  return coord1[0] === coord2[0] && coord1[1] === coord2[1];
}

export const shortenToOneDecimal = (num) => {
  const str = num.toFixed(2); // Convert to string with two decimals
  return str.slice(0, str.indexOf('.') + 2); // Keep only one decimal place
}

export const compareRoutes = (route1, route2) => {
  return shortenToOneDecimal(route1.distance) === shortenToOneDecimal(route2.distance)
}

export const linkRoute = (route, favRoutes) => {
  // route is already saved or favRoutes is not available
  if (route.saved || !favRoutes || !route.points) {
    return;
  }

  const matchedRoute = favRoutes.find(favRoute => (
    compareRoutes(route, favRoute) &&
    compareCoordinates(route.points[0], favRoute.start_point.coordinates) &&
    compareCoordinates(route.points[1], favRoute.end_point.coordinates)
  ));

  if (matchedRoute) {
    route.id = matchedRoute.id;
    route.label = matchedRoute.label;
    route.saved = true;
  }
}

export const getRoutes = async (firstPoint, secondPoint, favRoutes) => {
  const points = firstPoint + ',' + secondPoint;

  const routes = [];
  const fastestRoute = await getRoute(points);
  if (fastestRoute && fastestRoute.routeFound) {
    linkRoute(fastestRoute, favRoutes);
    routes.push(fastestRoute);
  }

  const shortestRoute = await getRoute(points, true);
  if (shortestRoute && shortestRoute.routeFound) {
    const hasEqualDistance = compareRouteDistance(fastestRoute, shortestRoute);
    if (!hasEqualDistance) {
      linkRoute(shortestRoute, favRoutes);
      routes.push(shortestRoute);
    }
  }

  return routes;
}
