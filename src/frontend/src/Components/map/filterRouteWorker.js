import { filterAdvisoryByRoute, filterByRoute } from './helpers/spatial';

self.onmessage = (event) => {
  const { data, route, action } = event.data;

  let filteredData = data;
  if (route) {
    filteredData = action === 'updateAdvisories' ? filterAdvisoryByRoute(data, route, null, true) : filterByRoute(data, route, null, false);
  }

  postMessage({ data, filteredData, route, action });
};
