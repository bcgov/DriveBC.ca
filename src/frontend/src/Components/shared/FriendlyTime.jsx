// React
import React from 'react';
import  {useState} from 'react';

// Third Party packages
import ReactTimeAgo from 'react-time-ago';
import OutsideClickHandler from 'react-outside-click-handler';

// Styling
import './FriendlyTime.scss';

const ONE_DAY = 1000 * 60 * 60 * 24; // 24 hours in milliseconds

export const formatDate = (date, tz, isNextUpdate=false) => {
  const datetimeFormat = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
    timeZoneName: 'short',
    timeZone: tz !== null ? tz: 'America/Vancouver',
  };
  const formatter = new Intl.DateTimeFormat('en-US', datetimeFormat);

  // get time difference in milliseconds
  const timeDiff = (new Date() - new Date(date));
  return (isNextUpdate && timeDiff > 0) ? "Update expected as soon as possible, please continue to check back." : formatter.format(new Date(date));
}

export default function FriendlyTime({ date, timezone, asDate=false, includeFullIfHumanized=false, timeOnly=false, isNextUpdate=false }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // get time difference in milliseconds
  const timeDiff = (new Date() - new Date(date));
  const dateFormatted = formatDate(date, timezone, isNextUpdate);

  // if difference is less than 24hrs
  const humanize = timeDiff < ONE_DAY;
  const dt = new Date(date);

  if (timeOnly) {
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
          <span className="friendly-time-text formatted-date">{dateFormatted}</span>
        }

        <div
          className="friendly-time"
          title={dateFormatted}
          onClick={(event) => {
            event.stopPropagation();
            setShowTooltip(!showTooltip);
          }}
          onKeyDown={(keyEvent) => {
            if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
              keyEvent.stopPropagation();
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
            <div className="friendly-time-text">
              {(isNextUpdate && timeDiff > 0) ? "Update expected as soon as possible, please continue to check back." :
                <ReactTimeAgo date={dt} verboseDate={dateFormatted} locale="en-US"/>
              }
            </div>
            { !(isNextUpdate && timeDiff > 0) &&
              <span className={"friendly-time__tooltip" + (showTooltip ? " showTooltip" : "")}>
                {dateFormatted}
              </span>
            }
          </OutsideClickHandler>
        </div>
      </React.Fragment>
    )
  }

  return <span className="friendly-time-text formatted-date">{dateFormatted}</span>;
}
