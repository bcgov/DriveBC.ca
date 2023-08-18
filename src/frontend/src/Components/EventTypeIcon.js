// Third Party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faPersonDigging,
  faCalendarDays,
  faSnowflake,
} from "@fortawesome/free-solid-svg-icons";

export default function EventTypeIcon({event_type}) {
  switch(event_type) {
    case "incident":
      return <FontAwesomeIcon icon={faTriangleExclamation} alt="incident" />;
    case "construction":
      return <FontAwesomeIcon icon={faPersonDigging} alt="construction" />;
    case "special_event":
      return <FontAwesomeIcon icon={faCalendarDays} alt="special event" />;
    case "weather_condition":
      return <FontAwesomeIcon icon={faSnowflake} alt="weather condition" />;
    default:
      return <FontAwesomeIcon icon={faTriangleExclamation} alt="incident" />;
  }
}
