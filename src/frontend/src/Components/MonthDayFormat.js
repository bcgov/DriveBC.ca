// React
import React from 'react';

const datetimeFormat = {
  month: 'short',
  day: 'numeric'
};
const formatter = new Intl.DateTimeFormat('en-US', datetimeFormat);

export default function MonthDayFormat({ date }) {

  const year = new Date().getFullYear();
  const dateFormatted = formatter.format(new Date(date.toString() + "-" + year.toString()));

  return dateFormatted;
}
