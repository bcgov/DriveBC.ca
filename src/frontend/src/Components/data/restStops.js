import { get } from "./helper.js";

// Env Variables
import { API_HOST } from "../../env.js";

export function getRestStops(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${API_HOST}/api/reststops/`, payload).then((data) => data);
}

export function isRestStopClosed(restStopProperties) {
  if (restStopProperties === undefined) {
    return false;
  }
  const isOpenYearRound = restStopProperties.OPEN_YEAR_ROUND === "Yes";
  if (isOpenYearRound) {
    return false;
  } else {
    const today = new Date();
    const year = today.getFullYear();
    const openDate = restStopProperties.OPEN_DATE;
    const closeDate = restStopProperties.CLOSE_DATE;
    if (openDate && closeDate) {
      const openDateY = new Date(year.toString() + "-"  + openDate.toString());
      const closeDateY =  new Date(year.toString() + "-" + closeDate.toString());
      const isInSeason = (today.getTime() > openDateY.getTime()) && (today.getTime() < closeDateY.getTime());
      const isClosed = isInSeason? false: true;
      return isClosed;
    } else {
      return true;
    }
  }
}
