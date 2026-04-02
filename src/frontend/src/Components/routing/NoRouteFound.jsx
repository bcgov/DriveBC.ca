// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation,
} from '@fortawesome/pro-solid-svg-icons';

// Styling
import './NoRouteFound.scss';

export default function NoRouteFound(props) {
  const { searchedRoutes, searchLocationFrom, searchLocationTo } = props;

  const isInBc = (searchLocationFrom, searchLocationTo) => {
    return searchLocationFrom[0] && searchLocationTo[0] && (
      (searchLocationFrom[0].label.includes(', BC') && searchLocationTo[0].label.includes(', BC')) ||
      (searchLocationFrom[0].label.includes('Current location'))
    );
}

  // Rendering
  return (
    <div className={`no-route-found-container ${!searchedRoutes.length ? 'open' : ''}`}>
      <FontAwesomeIcon icon={faCircleExclamation} />

      <span>
        {isInBc(searchLocationFrom, searchLocationTo) ?
          "No valid route between these two points." :
          "Routes outside of BC are not possible at the moment."
        }
    </span>
    </div>
  );
}
