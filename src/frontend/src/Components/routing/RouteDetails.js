// React
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import {
  updateSearchLocationFrom, updateSearchLocationTo, updateSearchedRoutes, updateSelectedRoute, // Route
  resetPendingAction, updatePendingAction // User
} from '../../slices'

// Navigation
import { createSearchParams, useNavigate } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFerry,
  faStar,
  faVideo,
  faFlag,
  faLocationDot,
  faPencil,
  faChevronRight
} from '@fortawesome/pro-solid-svg-icons';
import {
  faStar as faStarOutline,
  faCheck,
  faMinusCircle
} from '@fortawesome/pro-regular-svg-icons';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Skeleton from 'react-loading-skeleton';
import '@vaadin/time-picker';
import '@vaadin/date-picker';

// Internal imports
import { AlertContext, AuthContext, MapContext } from '../../App';
import { getRoute, removeRoute, saveRoute, patchRoute, compareRoutes, linkRoute } from "../data/routes";
import { addCameraGroups } from "../data/webcams";
import { getEventCounts } from "../data/events";
import { getAdvisoryCounts } from "../data/advisories";
import { compareRouteDistance, filterAdvisoryByRoute } from '../map/helpers';
import * as dataLoaders from '../map/dataLoaders'
import * as slices from '../../slices';
import NotificationEventType from "./forms/NotificationEventType";
import NotificationDateTime from "./forms/NotificationDateTime";
import RouteMap from './RouteMap';

// Styling
import './RouteDetails.scss';
import 'react-loading-skeleton/dist/skeleton.css'

export default function RouteDetails(props) {
  /* Setup */
  // Props
  const { route, isPanel, setRouteFavCams, setRouteLabel, onMobile, setShowRouteObjs } = props;

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);
  const { mapContext } = useContext(MapContext);

  // Ref
  const workerRef = useRef();
  const EventTypeFormRef = useRef();
  const DateTimeFormRef = useRef();

  // Navigation
  const navigate = useNavigate();

  // Redux
  const dispatch = useDispatch();
  const {
    feeds: {
      cameras: { list: cameras },
      events: { list: events },
      ferries: { list: ferries },
      wildfires: { list: wildfires },
    },
    advisories: { list: advisories },
    routes: { searchLocationFrom, searchLocationTo, selectedRoute },
    user: { favCams, favRoutes, pendingAction }

  } = useSelector(
    useCallback(
      memoize(state => ({
        feeds: {
          cameras: state.feeds.cameras,
          events: state.feeds.events,
          ferries: state.feeds.ferries,
          wildfires: state.feeds.wildfires,
        },
        advisories: state.cms.advisories,
        routes: state.routes,
        user: state.user
      })),
    ),
  );

  // States
  const [eventCount, setEventCount] = useState();
  const [ferryCount, setFerryCount] = useState();
  const [wildfireCount, setWildfireCount] = useState();
  const [advisoryCount, setAdvisoryCount] = useState();
  const [nickName, setNickName] = useState('');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [routeMapImg, setRouteMapImg] = useState(); // for map snapshot
  const [filteredFavCams, setFilteredFavCams] = useState();

  /* Notification states */
  const [notificationsEnabled, setNotificationsEnabled] = useState(route.notification);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [showSpecificTimeDate, setShowSpecificTimeDate] = useState(!!route.notification && !!route.notification_start_time);

  // Data
  const loadRouteCameras = async () => {
    // Don't load when user isn't logged in or if there are no cameras
    if (!favCams || !cameras) {
      return [];
    }

    const favCamData = cameras.filter(item => favCams.includes(item.id));
    const favCamGroupIds = favCamData.map(cam => cam.group);
    const favCamGroups = cameras.filter(cam => favCamGroupIds.includes(cam.group));
    const clonedFavCamGroups = structuredClone(favCamGroups);

    const groupedFavCamData = addCameraGroups(clonedFavCamGroups, favCams);

    if (groupedFavCamData.length) {
      workerRef.current.postMessage({
        data: groupedFavCamData,
        route: route,
        action: 'setFilteredFavCams'
      });

    } else {
      setFilteredFavCams([]);
    }
  }

  const resetWorker = () => {
    // Terminate the current worker if it exists
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    workerRef.current = new Worker(new URL('../map/filterRouteWorker.js', import.meta.url));

    // Set up event listener for messages from the worker
    workerRef.current.onmessage = function (event) {
      const { data, filteredData, action } = event.data;

      // Data specific to the RouteDetails component
      if (action === 'setEventCount') {
        setEventCount(getEventCounts(filteredData));

      } else if (action === 'setFerryCount') {
        setFerryCount(filteredData.length);

      // Data to be updated via dispatch
      } else if (action === 'setFilteredFavCams') {
        setFilteredFavCams(filteredData);

      } else if (action === 'setWildfireCount') {
        setWildfireCount(filteredData.length);

      // Data to be updated via dispatch
      } else {
        dispatch(
          slices[action]({
            list: data,
            filteredList: filteredData,
            timeStamp: new Date().getTime()
          })
        );
      }
    };
  }

  // Effects
  useEffect(() => {
    resetWorker();

    // Do not load in map
    if (isPanel) {
      return;
    }

    const routeData = selectedRoute && selectedRoute.routeFound ? selectedRoute : null;
    const displayError = () => {};

    if (!advisories) dataLoaders.loadAdvisories(routeData, null, dispatch, displayError, workerRef.current);
    if (!cameras) dataLoaders.loadCameras(routeData, null, dispatch, displayError, workerRef.current);
    if (!events) dataLoaders.loadEvents(routeData, null, dispatch, displayError, workerRef.current);
    if (!ferries) dataLoaders.loadFerries(routeData, null, dispatch, displayError, workerRef.current);

    // Cleanup function to terminate the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (!authContext.loginStateKnown || !authContext.username || !pendingAction) {
      return;
    }

    if (pendingAction.action === 'showSavePopup') {
      if(route.criteria !== selectedRoute.criteria) return;
      setShowSavePopup(true);
      dispatch(resetPendingAction());
    }

    if (pendingAction.action === 'toggleRouteNotification' && pendingAction.payload === route.id && authContext.verified) {
      setShowNotificationForm(true);
      dispatch(resetPendingAction());
    }
  }, [authContext, pendingAction]);

  useEffect(() => {
    if (advisories) {
      const advisoryData = filterAdvisoryByRoute(advisories, route, null, true);
      const advisoryCount = getAdvisoryCounts(advisoryData);
      setAdvisoryCount(advisoryCount);
    }
  }, [advisories]);

  useEffect(() => {
    if (cameras) {
      loadRouteCameras();
    }
  }, [cameras]);

  useEffect(() => {
    if (events) {
      workerRef.current.postMessage({
        data: events,
        route: route,
        action: 'setEventCount'
      });
    }
  }, [events]);

  useEffect(() => {
    if (ferries) {
      workerRef.current.postMessage({
        data: ferries,
        route: route,
        action: 'setFerryCount'
      });
    }
  }, [ferries]);

  useEffect(() => {
    if (wildfires) {
      workerRef.current.postMessage({
        data: wildfires,
        route: route,
        action: 'setWildfireCount'
      });
    }
  }, [wildfires]);

  useEffect(() => {
    if (showSavePopup) {
      setNickName(getDefaultLabel());
    }
  }, [showSavePopup]);

  /* Helpers */
  const toggleAuthModal = (action) => {
    setAuthContext((prior) => {
      if (!prior.showingModal) {
        return { ...prior, showingModal: true, action };
      }
      return prior;
    })
  };

  /* Handlers */
  const viewFavouriteCamHandler = async () => {
    setRouteFavCams(filteredFavCams);
    setRouteLabel(route.label ? route.label : route.start + ' to ' + route.end);
  }

  const resetPopup = () => {
    setShowSavePopup(false);
    setNickName('');
  }

  const saveRouteHandler = () => {
    saveRoute(route, selectedRoute, nickName, routeMapImg, searchLocationFrom[0].label, searchLocationTo[0].label, dispatch);
    resetPopup();
    setAlertMessage(<p>Saved to <a href="/my-routes">My routes</a></p>);
  }

  const favoriteHandler = () => {
    // User logged in, default handler
    if (authContext.loginStateKnown && authContext.username) {
      if (route.saved || !isPanel) {
        removeRoute(route, selectedRoute, dispatch);
        setAlertMessage(<p>Removed from <a href="/my-routes">My routes</a></p>);

      } else {
        setShowSavePopup(true);
      }

    // User not logged in, save pending action and open login modal
    } else {
      toggleAuthModal('Sign In');
      dispatch(updatePendingAction({
        action: 'showSavePopup'
      }));
    }
  }

  const switchRouteHandler = () => {
    if (!compareRoutes(route, selectedRoute)){
      dispatch(updateSelectedRoute(route));
    }
  }

  const showOnMap = async () => {
    const routePayload = {
      id: route.id,
      label: route.label,
      distance: route.distance,
      route: route.route.coordinates[0],
      saved: true,
      routeFound: true,
      points: [route.start_point.coordinates, route.end_point.coordinates],
      start_point: route.start_point,
      end_point: route.end_point,
      criteria: route.criteria,
      searchTimestamp: route.searchTimestamp
    }
    dispatch(updateSelectedRoute(routePayload));

    const alternateRoute = await getRoute(
      [route.start_point.coordinates, route.end_point.coordinates],
      route.criteria === 'fastest'
    );
    linkRoute(alternateRoute, favRoutes);

    let searchedRoutesPayload;
    if (compareRouteDistance(routePayload, alternateRoute)) { // Same route, don't use alternate route in payload
      searchedRoutesPayload = [routePayload];

    } else {
       searchedRoutesPayload = route.criteria === 'fastest' ? // Fastest before shortest
        [routePayload, alternateRoute] : [alternateRoute, routePayload];
    }

    dispatch(updateSearchedRoutes(searchedRoutesPayload));

    const startPayload = [{
      geometry: route.start_point,
      label: route.start,
    }];
    dispatch(updateSearchLocationFrom(startPayload));

    const endPayload = [{
      geometry: route.end_point,
      label: route.end,
    }];
    dispatch(updateSearchLocationTo(endPayload));

    localStorage.setItem("pendingFit", 'true');

    navigate({
      pathname: '/',
      search: `?${createSearchParams({
        type: "route",
      })}`
    });
  }

  /* Rendering */
  // Subcomponents
  const getDefaultLabel = (isPanel) => {
    if (isPanel) {
      return 'Route ' + (route.criteria === 'fastest' ? 'A' : 'B');
    }

    if (route.start && route.end) {
      return route.start + ' to ' + route.end;
    }

    if (searchLocationFrom && searchLocationFrom.length && searchLocationTo && searchLocationTo.length) {
      return searchLocationFrom[0].label + ' to ' + searchLocationTo[0].label;
    }
  }

  const toggleHandler = async (e) => {
    if (!authContext.verified) {
      e.preventDefault();

      // Set pending action to toggle notifications
      dispatch(updatePendingAction({
        action: 'toggleRouteNotification',
        payload: route.id,
      }));

      navigate('/verify-email?my_routes=true');
      return;
    }

    if (notificationsEnabled) {
      const body = { notification: false };
      const response = await patchRoute(route, selectedRoute, dispatch, body);
      setNotificationsEnabled(response.notification);

    } else {
      e.preventDefault();
      setShowNotificationForm(true);
    }
  };

  const validateSubmission = () => {
    const eventTypeValid = EventTypeFormRef.current.validateNotificationEventTypes();
    const dateTimeValid = DateTimeFormRef.current.validateNotificationDateTime();
    return eventTypeValid && dateTimeValid;
  }

  const saveHandler = async () => {
    if (!validateSubmission()) {
      return;
    }

    const defaultPayload = { notification: true };
    const eventTypePayload = EventTypeFormRef.current.getPayload();
    const dateTimePayload = DateTimeFormRef.current.getPayload();
    const payload = {
      ...defaultPayload,
      ...eventTypePayload,
      ...dateTimePayload
    };

    const response = await patchRoute(route, selectedRoute, dispatch, payload);
    setNotificationsEnabled(response.notification);
    setShowNotificationForm(false);
  }

  // Main components
  return route && (
    <React.Fragment>
      <Modal show={showNotificationForm} onHide={() => setShowNotificationForm(false)} animation={false} className={'modal--notifications-settings' + (showSpecificTimeDate ? ' long' : '')}>
        <Modal.Header closeButton>
          <Modal.Title>Notifications</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <h3>Settings for {route.label ? route.label : getDefaultLabel()}</h3>

          <div className="info-row row">
            <div className="info-row__label">
              <p className="bold">Email notifications to</p>
            </div>

            <div className="info-row__data">
              <p>{authContext.email}</p>
            </div>
          </div>

          <div className="info-row row">
            <div className="info-row__label">
              <p className="bold">Inform me about new and updated</p>
            </div>

            <div className="info-row__data">
              <NotificationEventType ref={EventTypeFormRef} route={route} />
            </div>
          </div>

          <div className="info-row row">
            <div className="info-row__label">
              <p className="bold">Send me notifications</p>
            </div>

            <div className="info-row__data">
              <NotificationDateTime
                ref={DateTimeFormRef}
                route={route}
                showSpecificTimeDate={showSpecificTimeDate}
                setShowSpecificTimeDate={setShowSpecificTimeDate} />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={saveHandler}>
            Enable notifications
            <FontAwesomeIcon icon={faCheck}/>
          </Button>

          <Button variant="primary-outline" className="cancel-btn" onClick={() => setShowNotificationForm(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <div
        className={`route-details ${isPanel && compareRoutes(route, selectedRoute) ? 'selected' : ''} ${onMobile ? 'mobile' : ''}`}
        tabIndex={isPanel ? 0 : null}
        onClick={isPanel ? switchRouteHandler : null}
        onKeyPress={isPanel ? switchRouteHandler : null}>

        <div className="route-title">
          <div className="space-between-row route-tools">
            {isPanel &&
              <span className={`route-index ${compareRoutes(route, selectedRoute) ? 'selected' : ''}`}>{(route.criteria === 'fastest') ? 'A' : 'B'}</span>
            }

            {!isPanel &&
              <div className="notifications-settings">
                <Form className="notifications-toggle">
                  <Form.Check
                    onClick={toggleHandler}
                    type="switch"
                    id={'notifications-switch-' + route.id}
                    label="Notifications"
                    checked={notificationsEnabled}
                  />
                </Form>
                {notificationsEnabled &&
                  <FontAwesomeIcon icon={faPencil}
                    tabIndex={0}
                    onClick={() => setShowNotificationForm(true)}
                  />
                }
              </div>
            }

            {authContext.loginStateKnown &&
              <button
                className={`favourite-btn text-only-btn
                  ${(route.saved || !isPanel) ? 'favourited' : ''}`}
                aria-label={`${(route.saved || !isPanel) ? 'Remove favourite' : 'Add favourite'}`}
                onClick={favoriteHandler}>
                <FontAwesomeIcon icon={(route.saved || !isPanel) ? faStar : faStarOutline}/>
                {(route.saved || !isPanel) ? "Remove" : "Save"}
              </button>
            }
          </div>

          {!isPanel &&
            <div
              className="card-img-box"
              tabIndex={0}
              onClick={showOnMap}
              onKeyPress={showOnMap}>

              <div className="overlay-screen centered-content">
                <p className="overlay-screen__text">
                  <FontAwesomeIcon icon={faLocationDot} alt="view on map"/>View on map
                </p>
              </div>
              <img className="card-img" src={route.thumbnail}/>
            </div>
          }

          <div className="route-name-and-distance">
            <h4 className="route-name">{route.label ? route.label : getDefaultLabel(isPanel)}</h4>
            <p className="route-distance">{Math.round(route.distance)} km</p>
          </div>

          {route.label && route.label !== getDefaultLabel() &&
            <p className="route-alt-name">{getDefaultLabel()}</p>
          }
        </div>

        <div className="route-disclosures">
          {eventCount
            ? (mapContext.visible_layers.closures &&
              <div className="route-pill route-pill--closures">
                  <span className="route-item__icon">
                    <FontAwesomeIcon icon={faMinusCircle} alt="closures"/>
                  </span>
                <span className="route-item__count">
                    {eventCount.closures}
                  </span>
                <span className="route-item__name">
                    {eventCount.closures != 1 ? ' Closures' : ' Closure'}
                  </span>
              </div>
            )
            : <Skeleton width={120}/>
          }

          {!isNaN(advisoryCount)
            ? (advisoryCount >= 0 &&
              <div className="route-pill route-pill--advisories">
                  <span className="route-item__icon">
                    <FontAwesomeIcon icon={faFlag} alt="advisories"/>
                  </span>
                <span className="route-item__count">
                    {advisoryCount}
                  </span>
                <span className="route-item__name">
                    {advisoryCount != 1 ? ' Advisories' : ' Advisory'}
                  </span>
              </div>
            )
            : <Skeleton width={120}/>
          }
        </div>

        <div className="route-items">
          {!!wildfireCount &&
            <div className="route-item route-item--wildfires">
              <span className="route-item__count">
                {wildfireCount}
              </span>
              <span className="route-item__icon">
                <span>fire</span>
              </span>
              <span className="route-item__name">{wildfireCount !== 1 ? 'Wildfires' : 'Wildfire'}</span>
            </div>
          }
          {(wildfireCount === undefined || wildfireCount === null) && <Skeleton height={32}/>}

          {(eventCount && mapContext.visible_layers.majorEvents) &&
            <div className="route-item route-item--major">
              <span className="route-item__count">
                {eventCount.majorEvents}
              </span>
              <span className="route-item__icon">
                <svg width="18" height="19" viewBox="0 0 18 19" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                    alt="major delays" aria-hidden="true" focusable="false" role="img">
                  <path className="filter-item__icon__path"
                        d="M1.22269 6.84836L6.45493 1.61612C7.89977 0.171277 10.2423 0.171276 11.6872 1.61612L16.9194 6.84836C18.3642 8.2932 18.3642 10.6358 16.9194 12.0806L11.6872 17.3128C10.2423 18.7577 7.89977 18.7577 6.45493 17.3128L1.22269 12.0806C-0.222156 10.6358 -0.222157 8.2932 1.22269 6.84836ZM3.18478 8.81045C2.82357 9.17166 2.82357 9.7573 3.18478 10.1185L8.41702 15.3507C8.77823 15.712 9.36386 15.712 9.72507 15.3507L14.9573 10.1185C15.3185 9.7573 15.3185 9.17166 14.9573 8.81045L9.72507 3.57821C9.36386 3.217 8.77823 3.217 8.41702 3.57821L3.18478 8.81045Z"/>
                </svg>
              </span>
              <span className="route-item__name">{eventCount.majorEvents != 1 ? 'Major delays' : 'Major delay'}</span>
            </div>
          }

          {(eventCount && mapContext.visible_layers.minorEvents) &&
            <div className="route-item route-item--minor">
              <span className="route-item__count">
                {eventCount.minorEvents}
              </span>
              <span className="route-item__icon">
                <svg width="18" height="16" viewBox="0 0 18 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                    alt="minor delays" aria-hidden="true" focusable="false" role="img">
                  <path className="filter-item__icon__path"
                        d="M15.501 0H2.50098C0.660978 0 -0.549022 1.65 0.250978 3.08L6.75098 14.77C7.66098 16.4 10.351 16.4 11.261 14.77L17.761 3.08C18.551 1.65 17.341 0 15.501 0ZM15.441 3.03L9.45098 13.81C9.45098 13.81 9.29098 14.01 8.94098 14.01C8.59098 14.01 8.46098 13.85 8.43098 13.81L2.59098 3.26C2.23098 2.61 2.48098 2 3.23098 2H14.961C15.551 2 15.741 2.51 15.451 3.03H15.441Z"/>
                </svg>
              </span>
              <span className="route-item__name">{eventCount.minorEvents != 1 ? 'Minor delays' : 'Minor delay'}</span>
            </div>
          }

          {(eventCount && mapContext.visible_layers.roadConditions) &&
            <div className="route-item route-item--roadConditions">
              <span className="route-item__count">
                {eventCount.roadConditions}
              </span>
              <span className="route-item__icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                    alt="road conditions" aria-hidden="true" focusable="false" role="img">
                  <path className="route-item__icon__path"
                        d="M19.5625 8.8925L11.1125 0.4425C10.4825 -0.1475 9.5125 -0.1475 8.8825 0.4425L0.4425 8.8925C-0.1475 9.5225 -0.1475 10.4925 0.4425 11.1225L8.8925 19.5725C9.5225 20.1625 10.4925 20.1625 11.1225 19.5725L19.5725 11.1225C20.1625 10.4925 20.1625 9.5225 19.5725 8.8925H19.5625ZM8.9425 10.4525L5.5625 13.8325C5.3125 14.0625 4.9225 14.0625 4.6725 13.8325L1.2925 10.4525C1.0625 10.2025 1.0625 9.8125 1.2925 9.5625L4.6725 6.1825C4.9225 5.9525 5.3125 5.9525 5.5625 6.1825L8.9425 9.5625C9.1725 9.8125 9.1725 10.2025 8.9425 10.4525ZM18.7225 10.4525L15.3425 13.8325C15.0925 14.0625 14.7025 14.0625 14.4525 13.8325L11.0725 10.4525C10.8425 10.2025 10.8425 9.8125 11.0725 9.5625L14.4525 6.1825C14.7025 5.9525 15.0925 5.9525 15.3425 6.1825L18.7225 9.5625C18.9525 9.8125 18.9525 10.2025 18.7225 10.4525Z"/>
                </svg>
              </span>
              <span className="route-item__name">{eventCount.roadConditions != 1 ? 'Road conditions' : 'Road condition'}</span>
            </div>
          }

          {(eventCount && eventCount.chainUps > 0) &&
            <div className="route-item route-item--chainUps">
              <span className="route-item__count">
                {eventCount.chainUps}
              </span>
              <span className="route-item__icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.05 4H9.52188C11.7719 4 13.6 5.86198 13.5719 8.15365C13.5719 10.1875 12.1375 11.9062 10.1969 12.25H10.1406C9.63438 12.3359 9.18438 11.9922 9.1 11.5052C9.01563 10.9896 9.35313 10.5312 9.83125 10.4453H9.8875C10.9844 10.2448 11.8 9.27083 11.8 8.15365C11.8 6.89323 10.7594 5.83333 9.52188 5.83333H5.05C3.8125 5.83333 2.8 6.89323 2.8 8.15365C2.8 9.27083 3.5875 10.2448 4.68438 10.4453H4.74063C5.21875 10.5312 5.55625 10.9896 5.47188 11.5052C5.3875 11.9922 4.9375 12.3359 4.43125 12.25H4.375C2.43438 11.9062 1 10.1875 1 8.15365C1 5.86198 2.8 4 5.05 4ZM14.9219 15H10.45C8.2 15 6.4 13.1667 6.4 10.875C6.4 8.84115 7.83438 7.1224 9.80313 6.77865H9.83125C10.3375 6.69271 10.7875 7.03646 10.8719 7.52344C10.9563 8.03906 10.6188 8.4974 10.1406 8.58333H10.0844C8.9875 8.78385 8.2 9.72917 8.2 10.875C8.2 12.1354 9.2125 13.1667 10.45 13.1667H14.9219C16.1875 13.1667 17.2 12.1354 17.2 10.875C17.2 9.72917 16.3844 8.78385 15.2875 8.58333H15.2313C14.7531 8.4974 14.4156 8.03906 14.5 7.52344C14.5844 7.03646 15.0344 6.69271 15.5406 6.77865H15.5969C17.5375 7.1224 19 8.84115 19 10.875C19 13.1667 17.1719 15 14.9219 15Z" fill="#474543"/>
              </svg>
              </span>
              <span className="route-item__name">{eventCount.chainUps != 1 ? 'Commercial chain ups' : 'Commercial chain up'}</span>
            </div>
          }

          {!!ferryCount &&
            <div className="route-item route-item--ferries">
              <span className="route-item__count">
                {ferryCount}
              </span>
              <span className="route-item__icon">
                <FontAwesomeIcon icon={faFerry} alt="Ferries"/>
              </span>
              <span className="route-item__name">{ferryCount !== 1 ? 'Ferries' : 'Ferry'}</span>
            </div>
          }
          {(ferryCount === undefined || ferryCount === null) && <Skeleton height={32}/>}

          {isPanel &&
            <Button
              variant="light"
              className='view-details-btn'
              onClick={() => {if (setShowRouteObjs) setShowRouteObjs(true)}}
              onKeyPress={() => {if (setShowRouteObjs) setShowRouteObjs(true)}}>

              View Details
              <FontAwesomeIcon icon={faChevronRight}/>
            </Button>
          }
        </div>

        {!isPanel &&
          <div className="myRoute-actions">
            {filteredFavCams
              ? <button
                className={`viewCams-btn text-only-btn ${filteredFavCams.length === 0 ? 'disabled' : ''}`}
                aria-label={filteredFavCams.length === 0 ? 'No favourite cameras on this route' : 'View favourite cameras on this route'}
                onClick={viewFavouriteCamHandler}
                disabled={filteredFavCams.length === 0}>
                <FontAwesomeIcon icon={faVideo}/>
                <span>{filteredFavCams.length === 0 ? 'No favourite cameras on this route' : 'Favourite cameras on this route'}</span>
              </button>
              : <Skeleton width={200}/>
            }
          </div>
        }

        {showSavePopup && (
          <Modal
            show={showSavePopup} onHide={resetPopup}>

            <Modal.Header closeButton>
              <Modal.Title>Save this route</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="route-nickname">
                    <p className="bold">Route nickname</p>
                  </Form.Label>
                  <Form.Control defaultValue={getDefaultLabel()} type="text" placeholder="Enter a name for this route"
                                onChange={(e) => setNickName(e.target.value)}/>
                </Form.Group>
              </Form>
              <div className="modal-buttons">
                <Button variant="primary" onClick={saveRouteHandler}>Save route <FontAwesomeIcon icon={faCheck}/></Button>
                <Button variant="light" onClick={resetPopup}>Cancel</Button>
              </div>
            </Modal.Body>
          </Modal>
        )}

        {isPanel &&
          <RouteMap route={route} showSavePopup={showSavePopup} setRouteMapImg={setRouteMapImg}/>
        }
      </div>
    </React.Fragment>
  );
}
