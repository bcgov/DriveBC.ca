// React
import React from 'react';
import  {useState} from 'react';

// Third Party packages
import ReactTimeAgo from 'react-time-ago';
import OutsideClickHandler from 'react-outside-click-handler';

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
const ONE_DAY = 1000 * 60 * 60 * 24; // 24 hours in milliseconds

export default function FriendlyTime({ date, asDate=false, includeFullIfHumanized=false, timeOnly=false }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // get time difference in milliseconds
  const timeDiff = (new Date() - new Date(date));
  const dateFormatted = formatter.format(new Date(date));
  // if difference is less than 24hrs
  const humanize = timeDiff < ONE_DAY;

  if (timeOnly) {
    const dt = new Date(date);
    let hour = dt.getHours();
    const period = hour >= 12 ? 'pm' : 'am';

    // Convert to 12-hour format
    hour = hour % 12;
    // Convert '0' to '12'
    hour = hour ? hour : 12;

    return <p className="friendly-time-text formatted-date">{`${hour}:00${period}`}</p>;
  }

  if (humanize && !asDate) {
    return (
      <React.Fragment>
        { includeFullIfHumanized &&
          <p className="friendly-time-text formatted-date">{dateFormatted}</p>
        }

        <div
          className="friendly-time"
          title={dateFormatted}
          onClick={(event) => {
            event.stopPropagation();
            setShowTooltip(!showTooltip);
          }}
          onKeyDown={(keyEvent) => {
            if (keyEvent.keyCode == 13) {
              event.stopPropagation();
              setShowTooltip(!showTooltip)
            }
          }}>

          <OutsideClickHandler
            onOutsideClick={() => {
              if (showTooltip) {
                setShowTooltip(!showTooltip);
              }
            }}
          >
            <p className="friendly-time-text">
              <ReactTimeAgo date={date} locale="en-US"/>
            </p>
            <span className={"friendly-time__tooltip" + (showTooltip ? " showTooltip" : "")}>
              {dateFormatted}
            </span>
          </OutsideClickHandler>
        </div>
      </React.Fragment>
    )
  }

  return <p className="friendly-time-text formatted-date">{dateFormatted}</p>;
}
