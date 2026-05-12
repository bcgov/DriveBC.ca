import { getCoastalFerries, getFerries } from '../../data/ferries';

export const loadFerries = async (route, ferries, dispatch, worker) => {
  const ferryData = ferries || [];

  // Fetch data if it doesn't already exist
  if (!ferries) {
    const inlandFerryData = await getFerries();
    const coastalFerryData = await getCoastalFerries();
    ferryData.push(...inlandFerryData, ...coastalFerryData);
  }

  // Trigger filter worker
  worker.postMessage({data: ferryData, route: (route && route.routeFound ? route : null), action: 'updateFerries'});
};
