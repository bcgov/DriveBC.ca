import { point } from '@turf/helpers';
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
         webcamData: mapWebcamData(data.results)
       }
    })
    .catch((error) => {
        //TODO: define a more meaningful error handling event
        mapWebcamData(defaultWebcams);
    });
}

export async function getWebcam(id) {
    return fetch('http://localhost:8000/api/webcams/' + id, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((response) => response.json())
      .then((data) => {
        return data;
    })
      .catch((error) => {
          //TODO: define a more meaningful error handling event
          mapWebcamData(defaultWebcams);
      });
  }

const mapWebcamData = (webcams) => {
    return webcams.map((webcam) => (
        point([webcam.location.coordinates[0], webcam.location.coordinates[1]], {
          url: webcam.links.imageSource,
          id: webcam.id,
          name: webcam.name,
          highway: webcam.highway,
          highway_description: webcam.highway_description,
          caption: webcam.caption,
          coords: {
            lng: webcam.location.coordinates[0],
            lat: webcam.location.coordinates[1]
          },
          marked_stale: webcam.marked_stale,
          marked_delayed: webcam.marked_delayed,
          is_on: webcam.is_on,
          timestamp: webcam.last_update_modified
        }, { id: webcam.id })
      ))
}


export default defaultWebcams;
