// React
import React from "react";
import { useState } from 'react';

// Third Party packages
import ReactTimeAgo from "react-time-ago";

// Styling
import "./FriendlyTime.scss";

const datetime_format = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  year: "numeric",
  timeZoneName: "short"
};
const formatter = new Intl.DateTimeFormat("en-US", datetime_format);

export default function FriendlyTime( {date} ) {
  const [showTooltip, setShowTooltip] = useState(false);

  //get time difference in seconds
  const time_diff = (new Date() - new Date(date));
  const date_formatted = formatter.format(new Date(date));

  //if difference is less than 24hrs
  if (time_diff < 86400000 ) {
    return <span 
            className={"friendly-time" + (showTooltip ? " showTooltip" : "") }
            title={date_formatted} 
            onClick={() => setShowTooltip(!showTooltip)}>
              <ReactTimeAgo date={date} locale="en-US"/>
            </span>
  }

  //else return formatted date without tooltip
  else {
    return date_formatted;
  }
}
