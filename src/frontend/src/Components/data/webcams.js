import { get } from './helper.js';

export function getCameras(routePoints, url = null) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(url ? url : `${window.API_HOST}/api/webcams/`, payload)
  .then((data) => data);
}

async function getFavoriteCameraIds(url, headers = {}) {
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

export async function getFavoriteCameras(url = null) {
  try {
    // get webcam IDs
    const userWebcamsUrl = url ? url : `${window.API_HOST}/api/users/webcams/`;
    const webcamsResponse = await getFavoriteCameraIds(userWebcamsUrl);
    const myWebcamIds = webcamsResponse.map(webcam => webcam.webcam);

    // Save a variable to session storage
    sessionStorage.setItem('myWebcamNum', myWebcamIds.length);

    // get the webcam data
    const webcamsUrl = `${window.API_HOST}/api/webcams/`;
    const data = await get(webcamsUrl);
    
    // Filter the data based on the obtained webcam IDs
    const filteredData = data.filter(item => myWebcamIds.includes(item.id));
    return filteredData;

  } catch (error) {
    console.error('Error fetching my webcam data:', error);
    throw error;
  }
}

export function getWebcamReplay(webcam) {
  // TODO: error handling
  return fetch(webcam.links.replayTheDay).then(response => response.json());
}

export function getCameraGroupMap(cameras) {
  // Map cameras by group
  const cameraMap = {};
  cameras.forEach((camera) => {
    if (!(camera.group in cameraMap)) {
      cameraMap[camera.group] = [];
    }

    cameraMap[camera.group].push(camera);
  });

  return cameraMap;
}

export function addCameraGroups(cameras) {
  const cameraMap = getCameraGroupMap(cameras);

  // Output list with one camera from each group
  const res = [];
  Object.values(cameraMap).forEach((group) => {
    group.forEach((cam) => cam.camGroup = group);
    res.push(group[0]);
  })

  return res;
}

export const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
