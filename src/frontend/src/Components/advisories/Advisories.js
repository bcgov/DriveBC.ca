// React
import React from 'react';

// Third Party packages
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";

// Styling
import './Advisories.scss';

// Components and functions
import AdvisoriesList from './AdvisoriesList';

export default function Advisories() {
  return (
    <div className="advisories">
      <div className="imagery">
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>
      <div className="content">
        <h3>Advisory</h3>
        <p>The following advisories affects a portion of the route you have chosen</p>
        <AdvisoriesList />
      </div>
    </div>
  );
}
