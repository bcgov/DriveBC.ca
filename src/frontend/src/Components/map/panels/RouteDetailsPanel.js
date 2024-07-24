// React
import React, { useCallback } from 'react';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// Internal imports
import RouteDetails from '../../routing/RouteDetails';

// Styling
import './RouteDetailsPanel.scss';

export default function RouteDetailsPanel() {
  /* Setup */
  // Redux
  const { selectedRoute } = useSelector(useCallback(memoize(state => ({
    selectedRoute: state.routes.selectedRoute
  }))));


  /* Rendering */
  // Main component
  return (
    <div className="popup popup--route" tabIndex={0}>
      <div className="popup__title">
        <p className="name">Your route</p>
      </div>

      <div className="popup__content">
        <RouteDetails route={selectedRoute} isPanel={true} />
      </div>
    </div>
  );
}
