// React
import React, { useCallback } from 'react';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// Internal imports
import RouteDetails from '../../routing/RouteDetails';

// External imports
import { useMediaQuery } from "@uidotdev/usehooks";

// Styling
import './RouteDetailsPanel.scss';

export default function RouteDetailsPanel() {
  /* Setup */
  // Misc
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Redux
  const { searchedRoutes, selectedRoute } = useSelector(useCallback(memoize(state => ({
    searchedRoutes: state.routes.searchedRoutes,
    selectedRoute: state.routes.selectedRoute
  }))));

  /* Rendering */
  // Main component
  return searchedRoutes && (
    <div className="popup popup--route" tabIndex={0}>
      <div className="popup__title">
        <p className="name">Your route</p>
      </div>

      <div className="popup__content">
        {largeScreen && searchedRoutes.map((route, index) => (
          <RouteDetails route={route} isPanel={true} index={index} key={index} />
        ))}

        {(!largeScreen && selectedRoute) &&
          <RouteDetails route={selectedRoute} isPanel={true} index={selectedRoute.criteria === 'fastest' ? 0 : 1} />
        }
      </div>
    </div>
  );
}
