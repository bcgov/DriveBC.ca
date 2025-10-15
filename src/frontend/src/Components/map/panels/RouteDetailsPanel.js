// React
import React, { useCallback, useEffect, useState } from 'react';

// Redux
import { useSelector } from 'react-redux';
import { memoize } from 'proxy-memoize';

// Internal imports
import RouteDetails from '../../routing/RouteDetails';
import RouteObjectList from "../../routing/RouteObjectList";

// External imports
import { useMediaQuery } from "@uidotdev/usehooks";

// Styling
import './RouteDetailsPanel.scss';

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
      wildfires: { filteredList: filteredWildfires },
    },
    advisories: { filteredList: filteredAdvisories },
    routes: { selectedRoute, searchedRoutes },

  } = useSelector(
    useCallback(
      memoize(state => ({
        feeds: {
          events: state.feeds.events,
          ferries: state.feeds.ferries,
          wildfires: state.feeds.wildfires,
        },
        advisories: state.cms.advisories,
        routes: state.routes,
      })),
    ),
  );

  // States
  const [routeSwitched, setRouteSwitched] = useState(true);
  const [pendingAdvisories, setPendingAdvisories] = useState(false);
  const [pendingEvents, setPendingEvents] = useState(false);
  const [pendingFerries, setPendingFerries] = useState(false);
  const [pendingWildfires, setPendingWildfires] = useState(false);

  // Effects
  // Mark data as not updating when they finish filtering
  useEffect(() => {
    if (!filteredAdvisories) return;

    setPendingAdvisories(true);
    if (!routeSwitched) {
      setRouteSwitched(true);
    }
  }, [filteredAdvisories]);

  useEffect(() => {
    if (!filteredEvents) return;

    setPendingEvents(true);
    if (!routeSwitched) {
      setRouteSwitched(true);
    }
  }, [filteredEvents]);

  useEffect(() => {
    if (!filteredFerries) return;

    setPendingFerries(true);
    if (!routeSwitched) {
      setRouteSwitched(true);
    }
  }, [filteredFerries]);

  useEffect(() => {
    if (!filteredWildfires) return;

    setPendingWildfires(true);
    if (!routeSwitched) {
      setRouteSwitched(true);
    }
  }, [filteredWildfires]);

  // When all data is filtered, rank the object list again
  useEffect(() => {
    if (pendingAdvisories && pendingEvents && pendingFerries && pendingWildfires) {
      setPendingAdvisories(false);
      setPendingEvents(false);
      setPendingFerries(false);
      setPendingWildfires(false);
      setRouteSwitched(false);
    }
  }, [pendingAdvisories, pendingEvents, pendingFerries, pendingWildfires]);

  /* Rendering */
  // Sub components
  const getDefaultPanel = () => (
    <div className="popup popup--route" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__name">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="11" stroke="#013366" strokeWidth="2"/>
          <path d="M17.5 8.4375C17.5 9.5332 16.2109 11.1445 15.6738 11.7676C15.5879 11.875 15.4805 11.918 15.3516 11.875H13.375C12.9883 11.875 12.6875 12.1973 12.6875 12.5625C12.6875 12.9492 12.9883 13.25 13.375 13.25H15.4375C16.5762 13.25 17.5 14.1738 17.5 15.3125C17.5 16.4512 16.5762 17.375 15.4375 17.375H9.48633C9.67969 17.1816 9.89453 16.9023 10.1309 16.6016C10.2598 16.4082 10.4102 16.2148 10.5391 16H15.4375C15.8027 16 16.125 15.6992 16.125 15.3125C16.125 14.9473 15.8027 14.625 15.4375 14.625H13.375C12.2363 14.625 11.3125 13.7012 11.3125 12.5625C11.3125 11.4238 12.2363 10.5 13.375 10.5H14.2129C13.7617 9.83398 13.375 9.06055 13.375 8.4375C13.375 7.29883 14.2988 6.375 15.4375 6.375C16.5762 6.375 17.5 7.29883 17.5 8.4375ZM9.01367 16.9023C8.92773 16.9883 8.8418 17.0742 8.79883 17.1387L8.75586 17.1816C8.62695 17.2676 8.43359 17.2676 8.32617 17.1387C7.76758 16.5371 6.5 15.0332 6.5 13.9375C6.5 12.7988 7.42383 11.875 8.5625 11.875C9.70117 11.875 10.625 12.7988 10.625 13.9375C10.625 14.582 10.1523 15.377 9.67969 16.043C9.44336 16.3652 9.20703 16.6445 9.01367 16.8809V16.9023ZM9.25 13.9375C9.25 13.5723 8.92773 13.25 8.5625 13.25C8.17578 13.25 7.875 13.5723 7.875 13.9375C7.875 14.3242 8.17578 14.625 8.5625 14.625C8.92773 14.625 9.25 14.3242 9.25 13.9375ZM15.4375 9.125C15.8027 9.125 16.125 8.82422 16.125 8.4375C16.125 8.07227 15.8027 7.75 15.4375 7.75C15.0508 7.75 14.75 8.07227 14.75 8.4375C14.75 8.82422 15.0508 9.125 15.4375 9.125Z" fill="#013366"/>
        </svg>
          <p className="name">Routes</p>
        </div>
      </div>

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
      <div className="popup__title">
        <div className="popup__title__name">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="11" stroke="#013366" strokeWidth="2"/>
          <path d="M17.5 8.4375C17.5 9.5332 16.2109 11.1445 15.6738 11.7676C15.5879 11.875 15.4805 11.918 15.3516 11.875H13.375C12.9883 11.875 12.6875 12.1973 12.6875 12.5625C12.6875 12.9492 12.9883 13.25 13.375 13.25H15.4375C16.5762 13.25 17.5 14.1738 17.5 15.3125C17.5 16.4512 16.5762 17.375 15.4375 17.375H9.48633C9.67969 17.1816 9.89453 16.9023 10.1309 16.6016C10.2598 16.4082 10.4102 16.2148 10.5391 16H15.4375C15.8027 16 16.125 15.6992 16.125 15.3125C16.125 14.9473 15.8027 14.625 15.4375 14.625H13.375C12.2363 14.625 11.3125 13.7012 11.3125 12.5625C11.3125 11.4238 12.2363 10.5 13.375 10.5H14.2129C13.7617 9.83398 13.375 9.06055 13.375 8.4375C13.375 7.29883 14.2988 6.375 15.4375 6.375C16.5762 6.375 17.5 7.29883 17.5 8.4375ZM9.01367 16.9023C8.92773 16.9883 8.8418 17.0742 8.79883 17.1387L8.75586 17.1816C8.62695 17.2676 8.43359 17.2676 8.32617 17.1387C7.76758 16.5371 6.5 15.0332 6.5 13.9375C6.5 12.7988 7.42383 11.875 8.5625 11.875C9.70117 11.875 10.625 12.7988 10.625 13.9375C10.625 14.582 10.1523 15.377 9.67969 16.043C9.44336 16.3652 9.20703 16.6445 9.01367 16.8809V16.9023ZM9.25 13.9375C9.25 13.5723 8.92773 13.25 8.5625 13.25C8.17578 13.25 7.875 13.5723 7.875 13.9375C7.875 14.3242 8.17578 14.625 8.5625 14.625C8.92773 14.625 9.25 14.3242 9.25 13.9375ZM15.4375 9.125C15.8027 9.125 16.125 8.82422 16.125 8.4375C16.125 8.07227 15.8027 7.75 15.4375 7.75C15.0508 7.75 14.75 8.07227 14.75 8.4375C14.75 8.82422 15.0508 9.125 15.4375 9.125Z" fill="#013366"/>
        </svg>
          <p className="name">Route details</p>
        </div>
      </div>

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
