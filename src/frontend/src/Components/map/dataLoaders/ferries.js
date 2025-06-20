import { getCoastalFerries, getFerries } from '../../data/ferries';

export const loadFerries = async (route, ferries, dispatch, displayError, worker) => {
  const ferryData = ferries || [];

  // Fetch data if it doesn't already exist
  if (!ferries) {
    const inlandFerryData = await getFerries().catch((error) => displayError(error));
    const coastalFerryData = await getCoastalFerries().catch((error) => displayError(error));
    ferryData.push(...inlandFerryData, ...coastalFerryData);
  }

  // Trigger filter worker
  worker.postMessage({data: ferryData, route: (route && route.routeFound ? route : null), action: 'updateFerries'});
};
