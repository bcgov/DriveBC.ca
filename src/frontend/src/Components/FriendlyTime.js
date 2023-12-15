// React
import React from 'react';
import  {useState} from 'react';

// Third Party packages
import ReactTimeAgo from 'react-time-ago';

// Styling
import './FriendlyTime.scss';

const datetimeFormat = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  year: 'numeric',
  timeZoneName: 'short',
};
const formatter = new Intl.DateTimeFormat('en-US', datetimeFormat);

export default function FriendlyTime( {date} ) {
  const [showTooltip, setShowTooltip] = useState(false);

  // get time difference in seconds
  const timeDiff = (new Date() - new Date(date));
  const dateFormatted = formatter.format(new Date(date));

  // if difference is less than 24hrs
  if (timeDiff < 86400000 ) {
    return <div
            className="friendly-time"
            title={dateFormatted}
            onClick={(event) => {
              event.stopPropagation();
              setShowTooltip(!showTooltip)}
            }>
            <p className={"friendly-time-text" }>
              <ReactTimeAgo date={date} locale="en-US"/>
            </p>
            <span className={"friendly-time__tooltip" + (showTooltip ? " showTooltip" : "")}>{dateFormatted}</span>
          </div>
  }

  // else return formatted date without tooltip
  else {
    return <p className="friendly-time-text formatted-date">
            {dateFormatted}
          </p>
  }
}
