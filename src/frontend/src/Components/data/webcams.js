import { post } from "./helper.js";

export function getWebcams(routePoints, url = null) {
  const payload = routePoints ? { route: routePoints } : {};

  return post(
    url ? url : `${process.env.REACT_APP_API_HOST}/api/webcams/`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }

  ).then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}

export function getWebcamReplay(webcam) {
  // TODO: error handling
  return fetch(webcam.links.replayTheDay).then((response) => response.json());
}
