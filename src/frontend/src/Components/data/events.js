import { post } from "./helper.js";

export function getEvents(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return post(
    `${process.env.REACT_APP_API_HOST}/api/events/`,
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
