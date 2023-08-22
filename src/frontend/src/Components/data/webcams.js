import defaultWebcams from '../__tests__/test_data/webcam_results_five_set.json';

export function getWebcams(url) {
  return fetch(url ? url : `//${process.env.REACT_APP_API_HOST}/api/webcams/`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        // TODO: define a more meaningful error handling event
        return {
          webcamResults: defaultWebcams,
        };
      });
}

export function getWebcamReplay(webcam) {
  // TODO: error handling
  return fetch(webcam.links.replayTheDay).then((response) => response.json());
}

export default defaultWebcams;
