import defaultWebcams from '../__tests__/test_data/webcam_results_five_set.json'

export function getWebcams(url) {
  return fetch(url ? url : 'http://localhost:8000/api/webcams/', {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.json())
    .then((data) => {
      return {
        webcamNextUrl: data.next,
        webcamResults: data.results
      };
    })
    .catch((error) => {
      //TODO: define a more meaningful error handling event
      return {
        webcamResults: defaultWebcams
      };
    });
}

export default defaultWebcams;
