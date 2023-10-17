import { get } from "./helper.js";

export function getWebcams(routePoints, url = null) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(url ? url : `${process.env.REACT_APP_API_HOST}/api/webcams/`, payload)
  .then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}

export function getWebcamReplay(webcam) {
  // TODO: error handling
  return fetch(webcam.links.replayTheDay).then((response) => response.json());
}
