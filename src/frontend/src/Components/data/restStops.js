import { get } from "./helper.js";

export function getRestStops(routePoints) {
  const payload = routePoints ? { route: routePoints } : {};

  return get(`${window.API_HOST}/api/reststops/`, payload)
  .then((data) => {
    return data})
  .catch((error) => {
    console.log(error);
  });
}

export function isRestStopClosed(restStopProperties) {
  if(restStopProperties === undefined){
    return false;
  }
  const isOpenYearRound = restStopProperties.OPEN_YEAR_ROUND === "Yes"? true: false;
  if(isOpenYearRound){
    return false;
  }
  else{
    const today = new Date();
    const year = today.getFullYear();
    const openDate = restStopProperties.OPEN_DATE;
    const closeDate = restStopProperties.CLOSE_DATE;
    if(openDate && closeDate){
      const openDateY = new Date(openDate.toString() + "-" + year.toString());
      const closeDateY =  new Date(closeDate.toString() + "-" + year.toString());
      const isInSeason = (today.getTime() > openDateY.getTime()) && (today.getTime() < closeDateY.getTime());
      const isClosed = isInSeason? false: true;
      return isClosed;
    }
    else{
      return true;
    }
  }
}
