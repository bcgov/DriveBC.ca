import { post, get } from './helper.js';

export function getWebcams(routePoints, url = null) {
  const payload = routePoints ? { route: routePoints } : {};

  if (routePoints) {
    return post(
      url ? url : `${process.env.REACT_APP_API_HOST}/api/webcams/`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
      .then(data => data)
      .catch(error => {
        console.log(error);
      });
  } else {
    return get(
      url ? url : `${process.env.REACT_APP_API_HOST}/api/webcams/`,
      payload,
    )
      .then(data => data)
      .catch(error => {
        console.log(error);
      });
  }
}

export function getWebcamReplay(webcam) {
  // TODO: error handling
  return fetch(webcam.links.replayTheDay).then(response => response.json());
}

export function groupCameras(cameras) {
  // Map cameras by group
  const cameraMap = {};
  cameras.forEach((camera) => {
    if (!(camera.group in cameraMap)) {
      cameraMap[camera.group] = [];
    }

    cameraMap[camera.group].push(camera);
  });

  // Output list with one camera from each group
  const res = [];
  Object.values(cameraMap).forEach((group) => {
    group.forEach((cam) => cam.camGroup = group);
    res.push(group[0]);
  })

  return res;
}
