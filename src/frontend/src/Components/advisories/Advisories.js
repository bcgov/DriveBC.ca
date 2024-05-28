// React
import React from 'react';

// External Components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation
} from "@fortawesome/pro-solid-svg-icons";

// Components and functions
import AdvisoriesList from './AdvisoriesList';

// Styling
import './Advisories.scss';

export default function Advisories(props) {
  const { advisories, selectedRoute } = props;

  return (advisories && !!advisories.length) ? (
    <div className="advisories">
      <div className="imagery">
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>

      <div className="content">
        <h2>
          {advisories.length > 1 ? 'Advisories ' : 'Advisory '}
          in effect
        </h2>

        {selectedRoute && selectedRoute.routeFound && Object.keys(selectedRoute).length !== 0 &&
          <p className="description">The following advisory affects a portion of the route you’ve chosen:</p>
        }

        <AdvisoriesList advisories={advisories} showDescription={false} showTimestamp={false} />
      </div>
    </div>
  ) : null;
}
