// React
import React from 'react';

// Third Party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faSnowflake,
  faMinusCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function EventTypeIcon({ displayCategory }) {
  switch (displayCategory) {
    case "closures":
      return <FontAwesomeIcon icon={faMinusCircle} alt="closure" />;
    case "majorEvents":
      return <svg className="customIcon" alt="major delays" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="customIcon-bg" d="M7.87872 1.12135C9.05029 -0.0502183 10.9498 -0.0502166 12.1214 1.12136L18.8787 7.87868C20.0503 9.05026 20.0503 10.9498 18.8787 12.1213L12.1213 18.8787C10.9497 20.0503 9.05026 20.0503 7.87868 18.8787L1.12136 12.1214C-0.0502174 10.9498 -0.0502174 9.05029 1.12136 7.87872L7.87872 1.12135Z" fill="#1A5A96"/>
              <path className="customIcon-fg" d="M10.8176 5.71429V11.4286C10.8176 11.8304 10.4403 12.1429 10.0126 12.1429C9.55976 12.1429 9.20755 11.8304 9.20755 11.4286V5.71429C9.20755 5.33483 9.55976 5.00001 10.0126 5.00001C10.4403 5.00001 10.8176 5.33483 10.8176 5.71429ZM10.0126 15C9.63523 15 9.30818 14.8438 9.13208 14.5536C8.95598 14.2857 8.95598 13.9509 9.13208 13.6607C9.30818 13.3929 9.63523 13.2143 10.0126 13.2143C10.3648 13.2143 10.6918 13.3929 10.8679 13.6607C11.044 13.9509 11.044 14.2857 10.8679 14.5536C10.6918 14.8438 10.3648 15 10.0126 15Z" fill="white"/>
             </svg>;
    case "minorEvents":
      return <svg alt="minor delays" width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="customIcon-bg" d="M11.2552 15.2763C10.3487 16.9079 7.65127 16.9079 6.74483 15.2763L0.247828 3.5816C-0.54594 2.1528 0.663609 0.5 2.50299 0.5L15.497 0.500001C17.3364 0.500001 18.5459 2.1528 17.7522 3.5816L11.2552 15.2763Z" fill="#1A5A96"/>
              <path className="customIcon-fg" d="M9.81761 3.21429V8.92857C9.81761 9.33036 9.44025 9.64286 9.01258 9.64286C8.55975 9.64286 8.20755 9.33036 8.20755 8.92857V3.21429C8.20755 2.83482 8.55975 2.5 9.01258 2.5C9.44025 2.5 9.81761 2.83482 9.81761 3.21429ZM9.01258 12.5C8.63522 12.5 8.30818 12.3438 8.13208 12.0536C7.95598 11.7857 7.95598 11.4509 8.13208 11.1607C8.30818 10.8929 8.63522 10.7143 9.01258 10.7143C9.36478 10.7143 9.69183 10.8929 9.86793 11.1607C10.044 11.4509 10.044 11.7857 9.86793 12.0536C9.69183 12.3438 9.36478 12.5 9.01258 12.5Z" fill="white"/>
             </svg>;
    case "futureEvents":
      return <FontAwesomeIcon icon={faCalendarDays} alt="future delays" />;
    case "roadConditions":
      return <FontAwesomeIcon icon={faSnowflake} alt="road conditions" />;
    default:
      return <svg alt="minor delays" width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="customIcon-bg" d="M11.2552 15.2763C10.3487 16.9079 7.65127 16.9079 6.74483 15.2763L0.247828 3.5816C-0.54594 2.1528 0.663609 0.5 2.50299 0.5L15.497 0.500001C17.3364 0.500001 18.5459 2.1528 17.7522 3.5816L11.2552 15.2763Z" fill="#1A5A96"/>
              <path className="customIcon-fg" d="M9.81761 3.21429V8.92857C9.81761 9.33036 9.44025 9.64286 9.01258 9.64286C8.55975 9.64286 8.20755 9.33036 8.20755 8.92857V3.21429C8.20755 2.83482 8.55975 2.5 9.01258 2.5C9.44025 2.5 9.81761 2.83482 9.81761 3.21429ZM9.01258 12.5C8.63522 12.5 8.30818 12.3438 8.13208 12.0536C7.95598 11.7857 7.95598 11.4509 8.13208 11.1607C8.30818 10.8929 8.63522 10.7143 9.01258 10.7143C9.36478 10.7143 9.69183 10.8929 9.86793 11.1607C10.044 11.4509 10.044 11.7857 9.86793 12.0536C9.69183 12.3438 9.36478 12.5 9.01258 12.5Z" fill="white"/>
             </svg>;
  }
}
