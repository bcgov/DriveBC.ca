// React
import React, { useCallback, useEffect, useState } from 'react';

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
  const {
    feeds: {
      events: { filteredList: filteredEvents },
      ferries: { filteredList: filteredFerries },
    },
    advisories: { filteredList: filteredAdvisories },
    routes: { selectedRoute, searchedRoutes },

  } = useSelector(
    useCallback(
      memoize(state => ({
        feeds: {
          events: state.feeds.events,
          ferries: state.feeds.ferries,
        },
        advisories: state.cms.advisories,
        routes: state.routes,
      })),
    ),
  );

  // States
  const [routeSwitched, setRouteSwitched] = useState(false);
  const [pendingAdvisories, setPendingAdvisories] = useState(false);
  const [pendingEvents, setPendingEvents] = useState(false);
  const [pendingFerries, setPendingFerries] = useState(false);

  // Effects
  // Mark data as not updating when they finish filtering
  useEffect(() => {
    setPendingAdvisories(true);
  }, [filteredAdvisories]);

  useEffect(() => {
    setPendingEvents(true);
  }, [filteredEvents]);

  useEffect(() => {
    setPendingFerries(true);
  }, [filteredFerries]);

  // When all data is filtered, rank the object list again
  useEffect(() => {
    if (pendingAdvisories && pendingEvents && pendingFerries) {
      setPendingAdvisories(false);
      setPendingEvents(false);
      setPendingFerries(false);
      setRouteSwitched(false);
    }
  }, [pendingAdvisories, pendingEvents, pendingFerries]);

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
          <RouteDetails
            key={index}
            route={route}
            isPanel={true}
            setShowRouteObjs={setShowRouteObjs}
            setRouteSwitched={setRouteSwitched} />
        ))}

        {(!largeScreen && selectedRoute) &&
          <RouteDetails
            route={selectedRoute}
            isPanel={true}
            onMobile={true}
            setShowRouteObjs={setShowRouteObjs}
            setRouteSwitched={setRouteSwitched} />
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
          routeSwitched={routeSwitched}
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
