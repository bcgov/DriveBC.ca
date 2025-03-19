// React
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';

// External imports
import Form from "react-bootstrap/Form";

// Internal imports
import { getPacficMidnight, getCurrentPacificDateString, isDaylightSavingTime } from "../../data/date";

// Styling
import './NotificaitonDateTime.scss';

const NotificationDateTime = forwardRef((props, ref) => {
  /* Setup */
  // Props
  const { route, showSpecificTimeDate, setShowSpecificTimeDate } = props;

  // Ref
  const startTimeRef = useRef();

  // States
  const [errorMessages, setErrorMessages] = useState([]);

  const specificDateOptions = ['Specific date', 'Date range', 'Days of the week'];
  const defaultSpecificDateOption = route.notification_days.length > 0 ? specificDateOptions[2] :
    (route.notification_end_date ? specificDateOptions[1] : specificDateOptions[0]);
  const [specificDateOption, setSpecificDateOption] = useState(defaultSpecificDateOption);

  // Time range
  const defaultStartTime = route.notification_start_time ? route.notification_start_time.split(':').slice(0, 2).join(':') : null;
  const defaultEndTime = route.notification_end_time ? route.notification_end_time.split(':').slice(0, 2).join(':') : null;
  const [allDay, setAllDay] = useState(defaultEndTime === '23:59');
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);

  // Date range
  const defaultStartDate = route.notification_start_date? route.notification_start_date : getCurrentPacificDateString();
  const defaultEndDate = route.notification_end_date;
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

  // Effects
  useEffect(() => {
    // Reset all date time options
    setDayOfWeek(defaultDayOfWeek);
    setStartTime(defaultStartTime);
    setEndTime(defaultEndTime);
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
  }, [showSpecificTimeDate]);

  useEffect(() => {
    if (!allDay) {
      setStartTime(defaultStartTime);
      setEndTime(defaultEndTime);

    } else {
      setStartTime('00:00');
      setEndTime('23:59');
    }
  }, [allDay]);

  useEffect(() => {
    // Bind event listeners to time pickers
    if (showSpecificTimeDate && !allDay) {
      const startTimePicker = document.querySelector('#startTimePicker');
      startTimePicker.addEventListener('value-changed', handleStartTimeChange);

      const endTimePicker = document.querySelector('#endTimePicker');
      endTimePicker.addEventListener('value-changed', handleEndTimeChange);

      return () => {
        startTimePicker.removeEventListener('value-changed', handleStartTimeChange);
        endTimePicker.removeEventListener('value-changed', handleEndTimeChange);
      }
    }
  }, [showSpecificTimeDate, allDay]);

  useEffect(() => {
    // Reset date options
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setDayOfWeek(defaultDayOfWeek);

    // No need to bind event listeners if specific time date is not shown
    if (!showSpecificTimeDate) {
      return;
    }

    // Bind event listeners to date pickers
    if (specificDateOption === 'Specific date') {
      const specificDatePicker = document.querySelector('#specificDate');
      specificDatePicker.addEventListener('value-changed', handleStartDateChange);

      return () => {
        specificDatePicker.removeEventListener('value-changed', handleStartDateChange);
      }

    } else if (specificDateOption === 'Date range') {
      const startDatePicker = document.querySelector('#startDate');
      startDatePicker.addEventListener('value-changed', handleStartDateChange);

      const endDatePicker = document.querySelector('#endDate');
      endDatePicker.addEventListener('value-changed', handleEndDateChange);

      return () => {
        startDatePicker.removeEventListener('value-changed', handleStartDateChange);
        endDatePicker.removeEventListener('value-changed', handleEndDateChange);
      };
    }
  }, [specificDateOption]);

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
    }
    else {
      setShowSpecificTimeDate(false);
    }
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.detail.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.detail.value);
  };

  const handleStartTimeChange = (event) => {
    setStartTime(event.detail.value);
  };

  const handleEndTimeChange = (event) => {
    setEndTime(event.detail.value);
  };

  const handleWeekDayChange = (event) => {
    setDayOfWeek({
      ...dayOfWeek,
      [event.target.value]: event.target.checked
    });
  };

  /* Rendering */
  // Main components
  return (
    <Form className="notifications-section notifications-time">
      <div key='Immediately and all the time'>
        <Form.Check
          type='radio'
          id='immediately'
          name='notifications-time'
          label='Immediately and all the time'
          onChange={handleRadioChange}
          defaultChecked={!showSpecificTimeDate} />
      </div>

      <div key='At a specific time and dates'>
        <Form.Check
          type='radio'
          id='specific'
          name='notifications-time'
          label='At a specific time and dates'
          onChange={handleRadioChange}
          defaultChecked={showSpecificTimeDate} />
      </div>

      { showSpecificTimeDate &&
        <div className="specific-time-dates">
          <Form.Check
            type='checkbox'
            id='all-day-checkbox'
            label='All Day'
            value={allDay}
            checked={allDay}
            onChange={() => setAllDay(!allDay)} />

          {!allDay &&
            <div className="info-row row">
              <div className="info-row__label">
                <p className="bold">Time</p>
              </div>

              <div className="info-row__data double-picker">
                <vaadin-time-picker
                  id="startTimePicker"
                  class={
                    errorMessages.includes('Please select a start and end time.') ||
                    errorMessages.includes('End time must be after start time.') ?
                      'pickerError' : ''
                  }
                  ref={startTimeRef}
                  step={60 * 15}
                  placeholder="Start time"
                  value={defaultStartTime}
                  max={endTime ? endTime : null}
                  error-message={startTimeRef.current ? startTimeRef.current.errorMessage : null}/>

                <span className="spacer"> — </span>

                <vaadin-time-picker
                  id="endTimePicker"
                  class={
                    errorMessages.includes('Please select a start and end time.') ||
                    errorMessages.includes('End time must be after start time.') ?
                      'pickerError' : ''
                  }
                  step={60 * 15}
                  placeholder="End time"
                  value={defaultEndTime}
                  min={startTime ? startTime : null} />
              </div>

              <p className='tz-note'>
                Times above are in {!isDaylightSavingTime() ? 'Pacific Standard Time (PST)' : 'Pacific Daylight Time (PDT)'}
              </p>
            </div>
          }

          <div className="info-row row">
            <div className="info-row__label">
              <Form.Select
                onChange={(e) => setSpecificDateOption(e.target.value)}
                defaultValue={specificDateOption}>

                {specificDateOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Form.Select>
            </div>

            {specificDateOption === 'Specific date' &&
              <div className="info-row__data">
                <vaadin-date-picker
                  id="specificDate"
                  class={
                    errorMessages.includes('Please select a specific date.') ||
                    errorMessages.includes('Specific date must be after today.') ?
                    'pickerError' : ''
                  }
                  placeholder="Select date"
                  value={defaultStartDate}
                  min={getCurrentPacificDateString()} />
              </div>
            }

            {specificDateOption === 'Date range' &&
              <div className="info-row__data double-picker">
                <vaadin-date-picker
                  id="startDate"
                  class={
                    errorMessages.includes('Please select a start and end date.') ||
                    errorMessages.includes('End date must be after start date.') ?
                    'pickerError' : ''
                  }
                  placeholder="Start date"
                  value={defaultStartDate}
                  min={getCurrentPacificDateString()}
                  max={endDate ? endDate : null } />

                <span className="spacer"> — </span>

                <vaadin-date-picker
                  id="endDate"
                  class={
                    errorMessages.includes('Please select a start and end date.') ||
                    errorMessages.includes('End date must be after start date.') ?
                    'pickerError' : ''
                  }
                  placeholder="End date"
                  value={defaultEndDate}
                  min={startDate ? startDate : getCurrentPacificDateString() } />
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
                    <div key={`${day}`}>
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
