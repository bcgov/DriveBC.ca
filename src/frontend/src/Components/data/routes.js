import { get } from "./helper.js";

export function getRoute(points) {
  const url = `${window.ROUTE_PLANNER}/directions.json`;

  return get(url, {
    points: points,
//    criteria: 'fastest',
//    outputSRS: 4036,
//    distanceUnit: 'km',
//    correctSide: true,
//    height: 5.1,
//    weight: 30001,
//    followTruckRoute: true,
//    partition: addressInput,
//    departure: '2019-02-28T11:36:00-08:00',
//    enable: 'td,gdf,ldf,tr,xc,tc',
//    roundTrip: false
    }, {
    headers: {
      'apiKey': `${window.ROUTE_PLANNER_KEY}`
    }
  }).then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}
