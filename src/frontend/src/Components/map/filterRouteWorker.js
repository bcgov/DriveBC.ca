import { filterAdvisoryByRoute, filterByRoute } from './helpers/spatial';

self.onmessage = (event) => {
  const startTime = performance.now();

  const { data, route, action } = event.data;

  let filteredData = data;

  if (route) {
    switch(action) {
      case 'updateAdvisories':
        filteredData = filterAdvisoryByRoute(data, route);
        break;
      case 'updateCameras':
      case 'updateEvents':
        filteredData = filterByRoute(data, route, null, true);
        break;
      default:
        filteredData = filterByRoute(data, route, null, false);
        break;
    }
  }

  const endTime = performance.now();
  console.log(`${action} took ${endTime - startTime} milliseconds`);

  postMessage({ data, filteredData, route, action });
};
