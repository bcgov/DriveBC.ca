// React
import React, {forwardRef, useImperativeHandle, useState} from 'react';

// External imports
import Form from "react-bootstrap/Form";

// Internal imports
import { getPacficMidnight, getCurrentPacificDateString, isDaylightSavingTime } from "../../data/date";

// Styling
import './NotificationDateTime.scss';

const NotificationDateTime = forwardRef((props, ref) => {
  /* Setup */
  // Props
  const { route, showSpecificTimeDate, setShowSpecificTimeDate } = props;

  // States
  const [errorMessages, setErrorMessages] = useState([]);

  const specificDateOptions = ['Specific date', 'Date range', 'Days of the week'];
  const defaultSpecificDateOption = route.notification_days.length > 0 ? specificDateOptions[2] :
    (route.notification_end_date ? specificDateOptions[1] : specificDateOptions[0]);
  const [specificDateOption, setSpecificDateOption] = useState(defaultSpecificDateOption);

  // Time range
  const defaultStartTime = route.notification_start_time ? route.notification_start_time.split(':').slice(0, 2).join(':') : '';
  const defaultEndTime = route.notification_end_time ? route.notification_end_time.split(':').slice(0, 2).join(':') : '';
  const [allDay, setAllDay] = useState(defaultEndTime === '23:59');
  const [startTime, setStartTime] = useState(allDay ? '00:00' : defaultStartTime);
  const [endTime, setEndTime] = useState(allDay ? '23:59' : defaultEndTime);

  // Date range
  const defaultStartDate = route.notification_start_date ? route.notification_start_date : getCurrentPacificDateString();
  const defaultEndDate = route.notification_end_date || '';
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Day of week
  const defaultDayOfWeek = {
    Monday: route.notification_days.includes('Monday'),
    Tuesday: route.notification_days.includes('Tuesday'),
    Wednesday: route.notification_days.includes('Wednesday'),
    Thursday: route.notification_days.includes('Thursday'),
    Friday: route.notification_days.includes('Friday'),
    Saturday: route.notification_days.includes('Saturday'),
    Sunday: route.notification_days.includes('Sunday')
  }
  const [dayOfWeek, setDayOfWeek] = useState(defaultDayOfWeek);

  /* Helpers */
  useImperativeHandle(ref, () => ({
    validateNotificationDateTime() {
      const errors = [];
      if (showSpecificTimeDate) {
        // Time range cases
        if (!startTime || !endTime) {
          errors.push('Please select a start and end time.');

        } else if (startTime > endTime) {
          errors.push('End time must be after start time.');
        }

        // Specific date cases
        if (specificDateOption === 'Specific date') {
          if (!startDate) {
            errors.push('Please select a specific date.');

          } else if (getPacficMidnight(startDate) < getPacficMidnight()) {
            errors.push('Specific date must be after today.');
          }

        // Date range cases
        } else if (specificDateOption === 'Date range') {
          if (!startDate || !endDate) {
            errors.push('Please select a start and end date.');

          } else if (getPacficMidnight(startDate) > getPacficMidnight(endDate)) {
            errors.push('End date must be after start date.');
          }

        // Days of the week cases
        } else if (specificDateOption === 'Days of the week' && !Object.values(dayOfWeek).some(value => value === true)) {
          errors.push('Please select at least one day of the week.');
        }
      }

      setErrorMessages(errors);
      return errors.length === 0;
    },

    getPayload() {
      const payload = {
        notification_days: [],
        notification_start_date: null,
        notification_end_date: null,
        notification_start_time: null,
        notification_end_time: null
      }

      // Send immediately and all the time
      if (!showSpecificTimeDate) {
        return payload;
      }

      // Time range for all date/day options
      payload.notification_start_time = startTime;
      payload.notification_end_time = endTime;

      // Specific date
      if (specificDateOption === 'Specific date') {
        payload.notification_start_date = startDate;

      // Date range
      } else if (specificDateOption === 'Date range') {
        payload.notification_start_date = startDate;
        payload.notification_end_date = endDate;

      // Days of the week
      } else {
        payload.notification_days = Object.keys(dayOfWeek).filter(day => dayOfWeek[day]);
      }

      return payload;
    }
  }));

  /* Handlers */
  const handleRadioChange = (event) => {
    if (event.target.id === 'specific') {
      setShowSpecificTimeDate(true);
    } else {
      setShowSpecificTimeDate(false);
    }
  };

  const handleAllDayChange = () => {
    const newAllDay = !allDay;
    setAllDay(newAllDay);
    if (newAllDay) {
      setStartTime('00:00');
      setEndTime('23:59');
    } else {
      setStartTime(defaultStartTime || '');
      setEndTime(defaultEndTime || '');
    }
  };

  const handleWeekDayChange = (event) => {
    setDayOfWeek({
      ...dayOfWeek,
      [event.target.value]: event.target.checked
    });
  };

  const hasTimeError = errorMessages.includes('Please select a start and end time.') ||
    errorMessages.includes('End time must be after start time.');
  const hasSpecificDateError = errorMessages.includes('Please select a specific date.') ||
    errorMessages.includes('Specific date must be after today.');
  const hasDateRangeError = errorMessages.includes('Please select a start and end date.') ||
    errorMessages.includes('End date must be after start date.');

  /* Rendering */
  return (
    <Form className="notifications-section">
      <div className="notifications-targets">
        <div key='Immediately and all the time' className="notifications-target">
          <Form.Check
            type='radio'
            id='immediately'
            name='notifications-time'
            label='Immediately and all the time'
            onChange={handleRadioChange}
            defaultChecked={!showSpecificTimeDate} />
        </div>

        <div key='At a specific time and dates' className="notifications-target">
          <Form.Check
            type='radio'
            id='specific'
            name='notifications-time'
            label='At a specific time and dates'
            onChange={handleRadioChange}
            defaultChecked={showSpecificTimeDate} />
        </div>
      </div>

      {showSpecificTimeDate &&
        <div className="specific-time-dates">
          <div className="time-row">
            <p className="bold">Time</p>

            <Form.Check
              type='checkbox'
              id='all-day-checkbox'
              label='All Day'
              checked={allDay}
              onChange={handleAllDayChange} />
          </div>

          {!allDay &&
            <div className="info-row row for-time-row">
              <div className="info-row__data double-picker">
                <Form.Control
                  type="time"
                  id="startTimePicker"
                  className={hasTimeError ? 'picker-error' : ''}
                  placeholder="Start time"
                  value={startTime}
                  max={endTime || undefined}
                  onChange={(e) => setStartTime(e.target.value)}
                  isInvalid={hasTimeError}
                />

                <span className="spacer"> — </span>

                <Form.Control
                  type="time"
                  id="endTimePicker"
                  className={hasTimeError ? 'picker-error' : ''}
                  placeholder="End time"
                  value={endTime}
                  min={startTime || undefined}
                  onChange={(e) => setEndTime(e.target.value)}
                  isInvalid={hasTimeError}
                />
              </div>

              <p className='tz-note'>
                Times above are in {!isDaylightSavingTime() ? 'Pacific Standard Time (PST)' : 'Pacific Daylight Time (PDT)'}
              </p>
            </div>
          }

          <div className="info-row row date-row">
            <div className="info-row__label">
              <Form.Select
                onChange={(e) => setSpecificDateOption(e.target.value)}
                value={specificDateOption}>
                {specificDateOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Form.Select>
            </div>

            {specificDateOption === 'Specific date' &&
              <div className="info-row__data">
                <Form.Control
                  type="date"
                  id="specificDate"
                  className={hasSpecificDateError ? 'picker-error' : ''}
                  placeholder="Select date"
                  value={startDate}
                  min={getCurrentPacificDateString()}
                  onChange={(e) => setStartDate(e.target.value)}
                  isInvalid={hasSpecificDateError}
                />
              </div>
            }

            {specificDateOption === 'Date range' &&
              <div className="info-row__data double-picker">
                <Form.Control
                  type="date"
                  id="startDate"
                  className={hasDateRangeError ? 'picker-error' : ''}
                  placeholder="Start date"
                  value={startDate}
                  min={getCurrentPacificDateString()}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  isInvalid={hasDateRangeError}
                />

                <span className="spacer"> — </span>

                <Form.Control
                  type="date"
                  id="endDate"
                  className={hasDateRangeError ? 'picker-error' : ''}
                  placeholder="End date"
                  value={endDate}
                  min={startDate || getCurrentPacificDateString()}
                  onChange={(e) => setEndDate(e.target.value)}
                  isInvalid={hasDateRangeError}
                />
              </div>
            }

            {specificDateOption === 'Days of the week' &&
              <div className="info-row__data">
                <Form className="notifications-dates">
                  {[
                    { day: "Monday", checked: dayOfWeek.Monday },
                    { day: "Tuesday", checked: dayOfWeek.Tuesday },
                    { day: "Wednesday", checked: dayOfWeek.Wednesday },
                    { day: "Thursday", checked: dayOfWeek.Thursday },
                    { day: "Friday", checked: dayOfWeek.Friday },
                    { day: "Saturday", checked: dayOfWeek.Saturday },
                    { day: "Sunday", checked: dayOfWeek.Sunday }
                  ].map(({day, checked}) => (
                    <div key={`${day}`} className="notifications-target">
                      <Form.Check
                        type='checkbox'
                        id={day}
                        label={day}
                        value={day}
                        checked={checked}
                        onChange={handleWeekDayChange}
                        isInvalid={errorMessages.includes('Please select at least one day of the week.')}/>
                    </div>
                  ))}
                </Form>
              </div>
            }
          </div>
        </div>
      }

      <Form.Control.Feedback type="invalid">
        {errorMessages.map((message, index) => (
          <div key={index}>{message}<br/></div>
        ))}
      </Form.Control.Feedback>
    </Form>
  );
});

NotificationDateTime.displayName = 'NotificationDateTime';

export default NotificationDateTime;
