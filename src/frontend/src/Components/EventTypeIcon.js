// React
import React from 'react';

// Third Party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faExclamationCircle,
  faPersonDigging,
  faCalendarDays,
  faSnowflake,
  faMinusCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function EventTypeIcon({ displayCategory }) {
  switch (displayCategory) {
    case "closures":
      return <FontAwesomeIcon icon={faMinusCircle} alt="closure" />;
    case "majorEvents":
      return <FontAwesomeIcon icon={faExclamationTriangle} alt="major delays" />;
    case "minorEvents":
      return <FontAwesomeIcon icon={faExclamationCircle} alt="minor delays" />;
    case "futureEvents":
      return <FontAwesomeIcon icon={faCalendarDays} alt="future delays" />;
    case "roadConditions":
      return <FontAwesomeIcon icon={faSnowflake} alt="road conditions" />;
    default:
      return <FontAwesomeIcon icon={faPersonDigging} alt="minor delays" />;
  }
}
