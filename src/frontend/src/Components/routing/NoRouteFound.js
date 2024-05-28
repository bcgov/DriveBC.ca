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
  const { selectedRoute } = props;

  // Rendering
  return (
    <div className={`no-route-found-container ${selectedRoute && !selectedRoute.routeFound ? 'open' : ''}`}>
      <FontAwesomeIcon icon={faCircleExclamation} />
      <span>No valid route between these two points.</span>
    </div>
  );
}
