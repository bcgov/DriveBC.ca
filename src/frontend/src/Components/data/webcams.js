import { get } from './helper.js';
import { getCookie } from "../../util";

export function getCameras(routePoints, url = null) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(url ? url : `${window.API_HOST}/api/webcams/`, payload)
  .then((data) => data);
}

export async function getFavoriteCameraIds(url, headers = {}) {
  const response = await fetch(url ? url : `${window.API_HOST}/api/users/webcams/`, {
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

export const addFavoriteCamera = async (id, dispatch, action) => {
  const url = `${window.API_HOST}/api/users/webcams/`;

  try {
   const response = await fetch(url, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-CSRFToken': getCookie('csrftoken')
     },
     body: JSON.stringify({ webcam: id }),
     credentials: 'include'
   });

   if (!response.ok) {
     throw new Error(`Error: ${response.statusText}`);
   }

   dispatch(action(id));

  } catch (error) {
    console.error('Error saving the camera:', error);
    throw error;
  }
}

export const deleteFavoriteCamera = async (id, dispatch, action) => {
  const url = `${window.API_HOST}/api/users/webcams/${id}/`;

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

   dispatch(action(id));

  } catch (error) {
    console.error('Error deleting the camera:', error);
    throw error;
  }
}

export function getWebcamReplay(webcam) {
  // TODO: error handling
  return fetch(webcam.links.replayTheDay).then(response => response.json());
}

const CARDINAL_ORDER = {
  'N': 0,
  'NE': 1,
  'E': 2,
  'SE': 3,
  'S': 4,
  'SW': 5,
  'W': 6,
  'NW': 7,
}

function sortGroup(a, b) {
  if (a.groupSort < b.groupSort) { return -1; }
  if (a.groupSort > b.groupSort) { return 1; }
  // groupSort is the same, indicating the views have the same orientation, so
  // sort on subscript
  return a.subscript < b.subscript ? -1 : 1;
}

export function getCameraGroupMap(cameras) {
  // Map cameras by group
  const cameraMap = {};
  // find multiple cameras with the same orientation per camera group
  const orientationMap = {}

  cameras.forEach((camera) => {
    if (!(camera.group in cameraMap)) {
      cameraMap[camera.group] = [];
    }
    cameraMap[camera.group].push(camera);
    camera.groupSort = CARDINAL_ORDER[camera.orientation];

    const groupOrientationId = `${camera.group}-${camera.orientation}`;
    if (!(groupOrientationId in orientationMap)) {
      orientationMap[groupOrientationId] = []
    }
    orientationMap[groupOrientationId].push(camera);
  });

  // Where there are multiple camera views with the same orientation in a group,
  // add a subscript value for sorting/display to differentiate.
  Object.values(orientationMap).forEach((orientation) => {
    if (orientation.length > 1) {
      orientation.forEach((camera, ii) => {
        camera.subscript = ii + 1;
      })
    }
  })

  // Sort cameras in group by orientation and subscript
  Object.values(cameraMap).forEach((group) => { group.sort(sortGroup); });

  return cameraMap;
}

export function addCameraGroups(cameras, favCams) {
  const cameraMap = getCameraGroupMap(cameras);

  // Output list with one camera from each group
  const res = [];
  Object.values(cameraMap).forEach((group) => {
    group.forEach((cam) => {
      cam.camGroup = group

      // Push favorite cameras if they exist
      if (favCams && favCams.includes(cam.id)) {
        res.push(cam);
      }
    });

    // Push first camera in group if no favCams
    if (!favCams) {
      res.push(group[0]);
    }
  })

  return res;
}

export const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
