// External imports
import { point, multiLineString } from '@turf/turf';

// Internal imports
import { get } from "./helper.js";
import { getCookie } from "../../util";
import { updateSelectedRoute } from '../../slices/routesSlice';
import { removeFavRoute, pushFavRoute } from '../../slices/userSlice';

export function getRoute(points) {
  const url = `${window.ROUTE_PLANNER}/directions.json`;

  return get(url, {
    points: points,
//    criteria: 'fastest',
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

    }, {
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


export const saveRoute = async (route, nickname, routeMapImg, startLabel, endLabel, dispatch) => {
  const url = `${window.API_HOST}/api/users/routes/`;

  const body = {
    label: nickname,
    distance: route.distance,
    distance_unit: route.distanceUnit,
    start: startLabel,
    end: endLabel,
    start_point: point(route.points[0]).geometry,
    end_point: point(route.points[1]).geometry,
    thumbnail: routeMapImg,
    route: multiLineString([route.route]).geometry,
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
    dispatch(updateSelectedRoute(payload));
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

    if (selectedRoute && selectedRoute.id == route.id) {
      const payload = {...selectedRoute, saved: false, label: null};
      dispatch(updateSelectedRoute(payload));
    }

    dispatch(removeFavRoute(route.id));

  } catch (error) {
    console.error('Error saving the camera:', error);
    throw error;
  }
}
