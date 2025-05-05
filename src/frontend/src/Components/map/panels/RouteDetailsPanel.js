// React
import React, { useCallback, useState } from 'react';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// Internal imports
import RouteDetails from '../../routing/RouteDetails';

// External imports
import { useMediaQuery } from "@uidotdev/usehooks";

// Styling
import './RouteDetailsPanel.scss';
import RouteObjectList from "../../routing/RouteObjectList";

export default function RouteDetailsPanel() {
  /* Setup */
  // Misc
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Redux
  const { searchedRoutes, selectedRoute } = useSelector(useCallback(memoize(state => ({
    searchedRoutes: state.routes.searchedRoutes,
    selectedRoute: state.routes.selectedRoute
  }))));

  // States
  const [routeDetailIndex, setRouteDetailIndex] = useState(null);

  /* Rendering */
  // Sub components
  const getDefaultPanel = () => (
    <div className="popup popup--route" tabIndex={0}>
      {largeScreen &&
        <div className="popup__title">
          <p className="name">Your route</p>
        </div>
      }

      <div className="popup__content">
        {largeScreen && searchedRoutes.map((route, index) => (
          <RouteDetails route={route} isPanel={true} index={index} key={index} setRouteDetailIndex={setRouteDetailIndex} />
        ))}

        {(!largeScreen && selectedRoute) &&
          <RouteDetails route={selectedRoute} isPanel={true} index={selectedRoute.criteria === 'fastest' ? 0 : 1} onMobile={true} setRouteDetailIndex={setRouteDetailIndex} />
        }
      </div>
    </div>
  );

  const getListPanel = () => (
    <div className="popup popup--route" tabIndex={0}>
      {largeScreen &&
        <div className="popup__title">
          <p className="name">Route details</p>
        </div>
      }

      <div className="popup__content">
        <RouteObjectList routeDetailIndex={routeDetailIndex} setRouteDetailIndex={setRouteDetailIndex} />
      </div>
    </div>
  );

  // Main component
  if (!searchedRoutes) {
    return;
  }

  return routeDetailIndex !== null ? getListPanel() : getDefaultPanel();
}
