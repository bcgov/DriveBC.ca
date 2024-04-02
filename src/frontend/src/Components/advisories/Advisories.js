// React
import React from 'react';

// Redux
import { updateAdvisories } from '../../slices/cmsSlice';

// External Components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";

// Components and functions
import AdvisoriesList from './AdvisoriesList';

// Styling
import './Advisories.scss';

export default function Advisories(props) {
  const { advisories } = props;

  return (advisories && !!advisories.length) ? (
    <div className="advisories">
      <div className="imagery">
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>

      <div className="content">
        <h3>Advisory</h3>
        <AdvisoriesList advisories={advisories} showDescription={false} showTimestamp={true} />
      </div>
    </div>
  ) : null;
}
