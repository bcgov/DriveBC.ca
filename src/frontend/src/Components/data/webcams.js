import { get } from './helper.js';

export function getCameras(routePoints, url = null) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(url ? url : `${window.API_HOST}/api/webcams/`, payload)
  .then((data) => data)
  .catch((error) => {
    console.log(error);
  });
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
