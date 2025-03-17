import { getBorderCrossings } from '../../data/borderCrossings';

export const loadBorderCrossings = async (route, borderCrossings, dispatch, displayError, worker) => {
  // Fetch data if it doesn't already exist
  const borderData = borderCrossings ? borderCrossings : await getBorderCrossings().catch((error) => displayError(error));

  // Trigger filter worker
  worker.postMessage({data: borderData, route: (route && route.routeFound ? route : null), action: 'updateBorderCrossings'});
};
