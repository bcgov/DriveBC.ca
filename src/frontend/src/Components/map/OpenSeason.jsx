// React
import React from 'react';

const datetimeFormat = {
  month: 'short',
  day: 'numeric'
};
const formatter = new Intl.DateTimeFormat('en-US', datetimeFormat);

export default function OpenSeason({ openDate, closeDate, returnState=false}) {

  const today = new Date();
  const year = today.getFullYear();
  const openDateY = new Date(year.toString() + "-" + openDate.toString());
  const closeDateY =  new Date(year.toString() + "-" + closeDate.toString());

  const openDateFormatted = formatter.format(openDateY);
  const closeDateFormatted = formatter.format(closeDateY);

  if (returnState) {
    const isInSeason = (today.getTime() > openDateY.getTime()) && (today.getTime() < closeDateY.getTime());

    if (isInSeason)
      return "open";
    else
      return "closed";
  }

  return <span>{openDateFormatted} – {closeDateFormatted}</span>;
}
