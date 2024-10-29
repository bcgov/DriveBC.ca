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
  const { searchedRoutes } = useSelector(useCallback(memoize(state => ({
    searchedRoutes: state.routes.searchedRoutes
  }))));


  /* Rendering */
  // Main component
  return searchedRoutes && (
    <div className="popup popup--route" tabIndex={0}>
      <div className="popup__title">
        <p className="name">Your route</p>
      </div>

      <div className="popup__content">
        {searchedRoutes.map((route, index) => (
          <RouteDetails route={route} isPanel={true} index={index} key={index} />
        ))}
      </div>
    </div>
  );
}
