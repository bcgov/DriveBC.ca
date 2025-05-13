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
import RouteObjectList from "../../routing/RouteObjectList";

export default function RouteDetailsPanel(props) {
  /* Setup */
  // Misc
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Props
  const { clickedFeatureRef, updateClickedFeature, showRouteObjs, setShowRouteObjs } = props;

  // Redux
  const { searchedRoutes, selectedRoute } = useSelector(useCallback(memoize(state => ({
    searchedRoutes: state.routes.searchedRoutes,
    selectedRoute: state.routes.selectedRoute
  }))));

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
          <RouteDetails route={route} isPanel={true} key={index} setShowRouteObjs={setShowRouteObjs} />
        ))}

        {(!largeScreen && selectedRoute) &&
          <RouteDetails route={selectedRoute} isPanel={true} onMobile={true} setShowRouteObjs={setShowRouteObjs} />
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

      <div className="popup__content route-object-list">
        <RouteObjectList
          setShowRouteObjs={setShowRouteObjs}
          clickedFeatureRef={clickedFeatureRef}
          updateClickedFeature={updateClickedFeature} />
      </div>
    </div>
  );

  // Main component
  if (!searchedRoutes) {
    return;
  }

  return showRouteObjs ? getListPanel() : getDefaultPanel();
}
