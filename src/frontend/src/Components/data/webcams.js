import { point } from '@turf/helpers';
import defaultWebcams from '../__tests__/test_data/webcam_results_five_set.json'

export async function getWebcams() {
  return fetch('http://localhost:8000/api/webcams/v1/', {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.json())
    .then((data) => (
       mapWebcamData(data.results)
    ))
    .catch((error) => {
        //TODO: define a more meaningful error handling event
        mapWebcamData(defaultWebcams);
    });
}

const mapWebcamData = (webcams) => {
    return webcams.map((webcam) => (
        point([webcam.location.coordinates[0], webcam.location.coordinates[1]], {
          url: webcam.links.currentImage,
          id: webcam.id,
          name: webcam.name,
          highway: webcam.highway,
          highway_description: webcam.highway_description,
          caption: webcam.caption,
          coords: {
            lng: webcam.location.coordinates[0],
            lat: webcam.location.coordinates[1]
          },
        }, { id: webcam.id })
      ))
}


export default defaultWebcams;