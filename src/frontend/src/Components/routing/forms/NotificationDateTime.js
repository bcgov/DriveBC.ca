// React
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';

// External imports
import Form from "react-bootstrap/Form";

// Styling
import './NotificaitonDateTime.scss';

const NotificationDateTime = forwardRef((props, ref) => {
  /* Setup */
  // Props
  const { showSpecificTimeDate, setShowSpecificTimeDate } = props;

  // Ref
  const startTimeRef = useRef();

  // States
  const [errorMessages, setErrorMessages] = useState([]);

  const specificDateOptions = ['Specific date', 'Date range', 'Days of the week'];
  const [specificDateOption, setSpecificDateOption] = useState(specificDateOptions[0]);

  // Date range
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();

  // Time range
  const [startTime, setStartTime] = useState();
  const [endTime, setEndTime] = useState();

  // Day of week
  const defaultDayOfWeek = {
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false
  }
  const [dayOfWeek, setDayOfWeek] = useState(defaultDayOfWeek);

  // Effects
  useEffect(() => {
    // Reset all date time options
    setDayOfWeek(defaultDayOfWeek);
    setStartDate(null);
    setStartTime(null);
    setEndDate(null);
    setEndTime(null);

    // Bind event listeners to time pickers
    if (showSpecificTimeDate) {
      const startTimePicker = document.querySelector('#startTimePicker');
      startTimePicker.addEventListener('value-changed', handleStartTimeChange);

      const endTimePicker = document.querySelector('#endTimePicker');
      endTimePicker.addEventListener('value-changed', handleEndTimeChange);

      return () => {
        startTimePicker.removeEventListener('value-changed', handleStartTimeChange);
        endTimePicker.removeEventListener('value-changed', handleEndTimeChange);
      }
    }
  }, [showSpecificTimeDate]);

  useEffect(() => {
    // Reset date options
    setStartDate(null);
    setEndDate(null);
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

          } else if (new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
            errors.push('Specific date must be after today.');
          }

        // Date range cases
        } else if (specificDateOption === 'Date range') {
          if (!startDate || !endDate) {
            errors.push('Please select a start and end date.');

          } else if (new Date(startDate) > new Date(endDate)) {
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
    if (event.target.value === 'specific') {
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
          value='immediately'
          onChange={handleRadioChange}
          defaultChecked />
      </div>

      <div key='At a specific time and dates'>
        <Form.Check
          type='radio'
          id='specific'
          name='notifications-time'
          label='At a specific time and dates'
          value='specific'
          onChange={handleRadioChange}
        />
      </div>

      { showSpecificTimeDate &&
        <div className="specific-time-dates">
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
                value={startTime}
                max={endTime ? endTime : null}
                error-message={startTimeRef.current ? startTimeRef.current.errorMessage : null} />

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
                value={endTime}
                min={startTime ? startTime : null} />
            </div>
          </div>

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
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]} />
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
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
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
                  value={endDate}
                  min={startDate ? startDate : new Date().toISOString().split('T')[0] } />
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
