// React
import React, { forwardRef, useImperativeHandle, useState } from 'react';

// External imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/pro-solid-svg-icons";
import Form from "react-bootstrap/Form";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from "react-bootstrap/Tooltip";

// Styling
import './NotificaitonEventType.scss';

const NotificationEventType = forwardRef((props, ref) => {
  /* Setup */
  // Props
  const { route } = props;

  // States
  const [errorMessage, setErrorMessage] = useState('');
  const [notificationEventTypes, setNotificationEventTypes] = useState({
    advisories: route.notification_types && route.notification_types.includes('advisories'),
    closures: route.notification_types && route.notification_types.includes('closures'),
    majorEvents: route.notification_types && route.notification_types.includes('majorEvents'),
    minorEvents: route.notification_types && route.notification_types.includes('minorEvents'),
    roadConditions: route.notification_types && route.notification_types.includes('roadConditions'),
    chainUps: route.notification_types && route.notification_types.includes('chainUps'),
  });

  /* Helpers */
  useImperativeHandle(ref, () => ({
    validateNotificationEventTypes() {
      const isValid = Object.values(notificationEventTypes).some(value => value === true);
      if (!isValid) {
        setErrorMessage('At least one notification event type must be selected.');
      } else {
        setErrorMessage('');
      }
      return isValid;
    },

    getPayload() {
      return {
        notification_types: Object.keys(notificationEventTypes).filter(type => notificationEventTypes[type])
      };
    }
  }));

  /* Handlers */
  const eventTypeHandler = (e) => {
    setNotificationEventTypes({
      ...notificationEventTypes,
      [e.target.value]: e.target.checked
    });
  }

  /* Rendering */
  // Sub components
  const tooltipAdvisories = (
    <Tooltip id="tooltipAdvisories" className="tooltip-content">
      <p>Major events, such as storms, that impact large areas that include locations on your trip</p>
    </Tooltip>
  );

  const tooltipClosures = (
    <Tooltip id="tooltipClosures" className="tooltip-content">
      <p>A delay of 30 minutes or more that can not be routed around on your trip</p>
    </Tooltip>
  );

  const tooltipMajor = (
    <Tooltip id="tooltipMajor" className="tooltip-content">
      <p>A delay of 30 minutes or more on your trip</p>
    </Tooltip>
  );

  const tooltipMinor = (
    <Tooltip id="tooltipMinor" className="tooltip-content">
      <p>A delay of less than 30 minutes on your trip</p>
    </Tooltip>
  );

  const tooltipRoadConditions = (
    <Tooltip id="tooltipRoadConditions" className="tooltip-content">
      <p>Changes in the state of the road that may impact your trip, such as slippery or snow covered</p>
    </Tooltip>
  );

  const tooltipCommercial = (
    <Tooltip id="tooltipCommercial" className="tooltip-content">
      <p>Segments of the highway that require Commercial Vehicles over 11,794kg to have chains on in order to use the highway</p>
    </Tooltip>
  );

  // Main components
  return (
    <Form className="notifications-section notifications-targets">

      {[
        { name: 'Advisories', tooltip: tooltipAdvisories, value: 'advisories', checked: notificationEventTypes.advisories },
        { name: 'Closures', tooltip: tooltipClosures, value: 'closures', checked: notificationEventTypes.closures },
        { name: 'Major delays', tooltip: tooltipMajor, value: 'majorEvents', checked: notificationEventTypes.majorEvents },
        { name: 'Minor delays', tooltip: tooltipMinor, value: 'minorEvents', checked: notificationEventTypes.minorEvents },
        { name: 'Road Conditions', tooltip: tooltipRoadConditions, value: 'roadConditions', checked: notificationEventTypes.roadConditions },
        { name: 'Chain-ups in effect', tooltip: tooltipCommercial, value: 'chainUps', checked: notificationEventTypes.chainUps },

      ].map(({ name, tooltip, value, checked }) => (
        <div key={name}>
          <Form.Check
            type='checkbox'
            id={name}
            label={name}
            value={value}
            checked={checked}
            onChange={eventTypeHandler}
            isInvalid={!!errorMessage} />

          <OverlayTrigger placement="top" overlay={tooltip}>
            <FontAwesomeIcon icon={faCircleInfo} />
          </OverlayTrigger>
        </div>
      ))}

      <Form.Control.Feedback type="invalid">
        {errorMessage}
      </Form.Control.Feedback>
    </Form>
  );
});

NotificationEventType.displayName = 'NotificationEventType';

export default NotificationEventType;
