import { getBorderCrossings } from '../../data/borderCrossings';

export const loadBorderCrossings = async (route, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const borderCrossings = await getBorderCrossings().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: borderCrossings, route: (route && route.routeFound ? route : null), action: 'updateBorderCrossings'});
};
