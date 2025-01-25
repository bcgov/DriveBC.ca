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
  const [errorMessage, setErrorMessage] = useState('');

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

  useEffect(() => {
    if (startTime) {
      console.log(startTime);
      console.log(startTimeRef.current);
      console.log(startTimeRef.current.invalid);
    }
  }, [startTime]);

  /* Helpers */
  useImperativeHandle(ref, () => ({
    validateNotificationDateTime() {
      if (showSpecificTimeDate) {
        // Specific date cases
        if (specificDateOption === 'Specific date' && !startDate) {
          setErrorMessage('Please select a specific date.');
          return false;

        // Date range cases
        } else if (specificDateOption === 'Date range') {
          if (!startDate || !endDate) {
            setErrorMessage('Please select a start and end date.');
            return false;

          } else if (new Date(startDate) > new Date(endDate)) {
            setErrorMessage('End date must be after start date.');
            return false;
          }

        // Days of the week cases
        } else if (specificDateOption === 'Days of the week' && !Object.values(dayOfWeek).some(value => value === true)) {
          setErrorMessage('Please select at least one day of the week.');
          return false;
        }
      }

      return true;
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
    console.log(event);
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
                ref={startTimeRef}
                step={60 * 15}
                placeholder="Start time"
                required
                value={startTime}
                max={endTime ? endTime : null}
                error-message={startTimeRef.current ? startTimeRef.current.errorMessage : null} />

              <span className="spacer"> — </span>

              <vaadin-time-picker
                id="endTimePicker"
                step={60 * 15}
                placeholder="End time"
                required
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
                  placeholder="Select date"
                  value={startDate}
                  required
                  min={new Date().toISOString().split('T')[0]} />
              </div>
            }

            {specificDateOption === 'Date range' &&
              <div className="info-row__data double-picker">
                <vaadin-date-picker
                  id="startDate"
                  placeholder="Start date"
                  value={startDate}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  max={endDate ? endDate : null } />

                <span className="spacer"> — </span>

                <vaadin-date-picker
                  id="endDate"
                  placeholder="End date"
                  value={endDate}
                  required
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
                        isInvalid={!!errorMessage && showSpecificTimeDate &&
                          specificDateOption === 'Days of the week'
                        } />
                    </div>
                  ))}

                  <Form.Control.Feedback type="invalid">
                    {errorMessage}
                  </Form.Control.Feedback>
                </Form>
              </div>
            }
          </div>
        </div>
      }
    </Form>
  );
});

NotificationDateTime.displayName = 'NotificationDateTime';

export default NotificationDateTime;
