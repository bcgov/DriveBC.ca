// React
import React, { useCallback, useContext, useEffect, useState } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import {
  resetPendingAction, updatePendingAction // User
} from '../../slices'

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFerry,
  faStar,
  faFlag,
  faArrowLeft
} from '@fortawesome/pro-solid-svg-icons';
import { faStar as faStarOutline,
  faCheck,
  faMinusCircle,
 } from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Skeleton from "react-loading-skeleton";

// Internal imports
import { AlertContext, AuthContext, FeatureContext } from '../../App';
import { removeRoute, saveRoute } from "../data/routes";
import { collator } from "../data/webcams";
import { populateRouteProjection } from '../map/helpers';
import { eventClickHandler, ferryClickHandler, wildfireClickHandler } from "../map/handlers/click";
import RouteMap from './RouteMap';

// Styling
import './RouteObjectList.scss';
import 'react-loading-skeleton/dist/skeleton.css'
import { advisoryStyles } from "../data/featureStyleDefinitions";

export default function RouteObjectList(props) {
  /* Setup */
  // Misc
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Props
  const { routeSwitched, setShowRouteObjs, clickedFeatureRef, updateClickedFeature } = props;

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);
  const { featureContext } = useContext(FeatureContext);

  // Redux
  const dispatch = useDispatch();
  const {
    feeds: {
      events: { filteredList: filteredEvents },
      ferries: { filteredList: filteredFerries },
      wildfires: { filteredList: filteredWildfires },
    },
    advisories: { filteredList: filteredAdvisories },
    routes: { searchLocationFrom, searchLocationTo, selectedRoute },
    user: { pendingAction }

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
        user: state.user
      })),
    ),
  );

  // States
  const [nickName, setNickName] = useState('');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [routeMapImg, setRouteMapImg] = useState(); // for map snapshot
  const [objList, setObjList] = useState([]);

  // Effects
  useEffect(() => {
    if (!authContext.loginStateKnown || !authContext.username || !pendingAction) {
      return;
    }

    if (pendingAction.action === 'showSavePopup') {
      setShowSavePopup(true);
      dispatch(resetPendingAction());
    }
  }, [authContext, pendingAction]);

  // When all data is filtered, rank the object list again
  useEffect(() => {
    // Only rank when route has finished switching
    if (!routeSwitched) {
      rankObjectList();
    }
  }, [routeSwitched]);

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
  const rankObjectList = () => {
    const objs = [...filteredEvents, ...filteredFerries, ...filteredAdvisories, ...filteredWildfires];
    const projectedObjs = populateRouteProjection(objs, selectedRoute);
    projectedObjs.sort(function(a, b) {
      return collator.compare(a.route_projection, b.route_projection);
    });

    setObjList(projectedObjs);
  }

  const resetPopup = () => {
    setShowSavePopup(false);
    setNickName('');
  }

  const saveRouteHandler = () => {
    saveRoute(selectedRoute, selectedRoute, nickName, routeMapImg, searchLocationFrom[0].label, searchLocationTo[0].label, dispatch);
    resetPopup();
    setAlertMessage(<p>Saved to <a href="/my-routes">My routes</a></p>);
  }

  const favoriteHandler = () => {
    // User logged in, default handler
    if (authContext.loginStateKnown && authContext.username) {
      if (selectedRoute.saved) {
        removeRoute(selectedRoute, selectedRoute, dispatch);
        setAlertMessage(<p>Removed from <a href="/my-routes">My routes</a></p>);

      } else {
        setShowSavePopup(true);
      }

    // User not logged in, save pending action and open login modal
    } else {
      toggleAuthModal('Sign in');
      dispatch(updatePendingAction({
        action: 'showSavePopup'
      }));
    }
  }

  const eventFeatureHandler = (event) => {
    if (featureContext.events && event.id in featureContext.events) {
      eventClickHandler(
        featureContext.events[event.id],
        clickedFeatureRef,
        updateClickedFeature,
        false
      );
    }
  }

  const ferryFeatureHandler = (ferry) => {
    if (featureContext.ferries && ferry.id in featureContext.ferries) {
      ferryClickHandler(
        featureContext.ferries[ferry.id],
        clickedFeatureRef,
        updateClickedFeature,
        false,
      );
    }
  }

  const advisoryFeatureHandler = (advisory) => {
    if (featureContext.advisories && advisory.id in featureContext.advisories) {
      const feature = featureContext.advisories[advisory.id];

      // set new clicked ferry feature
      feature.setStyle(advisoryStyles['active']);
      feature.setProperties({ clicked: true }, true);
      updateClickedFeature(feature);
    }
  }

  const wildfireFeatureHandler = (wildfire) => {
    if (featureContext.wildfires && wildfire.id in featureContext.wildfires) {
      wildfireClickHandler(
        featureContext.wildfires[wildfire.id],
        clickedFeatureRef,
        updateClickedFeature,
        false,
      );
    }
  }

  /* Rendering */
  // Subcomponents
  const getDefaultLabel = () => {
    if (selectedRoute.start && selectedRoute.end) {
      return selectedRoute.start + ' to ' + selectedRoute.end;
    }

    if (searchLocationFrom && searchLocationFrom.length && searchLocationTo && searchLocationTo.length) {
      return searchLocationFrom[0].label + ' to ' + searchLocationTo[0].label;
    }
  }

  const getObjectList = () => {
    if (routeSwitched) {
      return (
        <div>
          <Skeleton count={5} width={200} />
        </div>
      );
    }

    return objList.map((obj, index) => {
      // DBC22-4796: workaround for wildfires display_category not showing due to caching
      if (obj.status && obj.reported_date) {
        return (
          <div
            className="route-item route-item--major"
            key={index}
            onClick={() => wildfireFeatureHandler(obj)}
            onKeyDown={() => wildfireFeatureHandler(obj)}
            role="button"
            tabIndex={0}>

            <span className="route-item__icon">
              <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2.43359 5.04297C1.75 6.24609 1.3125 7.47656 1.3125 8.48828C1.3125 11.3047 3.41797 13.4375 6.125 13.4375C8.77734 13.4375 10.9375 11.3047 10.9375 8.48828C10.9375 7.69531 10.6367 6.62891 10.1445 5.58984C9.70703 4.60547 9.13281 3.73047 8.58594 3.15625C8.47656 3.29297 8.33984 3.48438 8.17578 3.67578C8.12109 3.78516 8.03906 3.89453 7.95703 4.00391C7.84766 4.16797 7.71094 4.35938 7.62891 4.46875C7.51953 4.63281 7.32812 4.71484 7.10938 4.74219C6.91797 4.74219 6.72656 4.63281 6.58984 4.46875C6.50781 4.35938 6.39844 4.22266 6.28906 4.11328C5.76953 3.42969 5.16797 2.66406 4.64844 2.14453C3.91016 2.85547 3.08984 3.89453 2.43359 5.04297ZM5.44141 1.07812C5.96094 1.57031 6.5625 2.30859 7.08203 2.96484L7.10938 2.9375C7.30078 2.63672 7.54688 2.30859 7.76562 2.08984C8.23047 1.67969 8.91406 1.67969 9.37891 2.08984C10.0898 2.80078 10.8008 3.89453 11.3203 5.04297C11.8672 6.16406 12.25 7.42188 12.25 8.48828C12.25 12.0156 9.51562 14.75 6.125 14.75C2.67969 14.75 0 11.9883 0 8.48828C0 7.12109 0.546875 5.67188 1.28516 4.38672C2.02344 3.10156 2.98047 1.89844 3.85547 1.07812C4.32031 0.667969 5.00391 0.667969 5.44141 1.07812ZM6.15234 12.125C4.42969 12.125 3.0625 11.0312 3.03516 9.14453C3.03516 8.32422 3.5 7.58594 4.42969 6.4375C4.62109 6.21875 4.94922 6.21875 5.11328 6.4375C5.57812 7.01172 6.37109 8.05078 6.83594 8.625C7 8.84375 7.32812 8.84375 7.49219 8.625L8.20312 7.83203C8.36719 7.61328 8.69531 7.64062 8.80469 7.88672C9.48828 9.14453 9.1875 10.7578 8.03906 11.5508C7.46484 11.9336 6.86328 12.125 6.15234 12.125Z"
                  fill="currentColor"/>
              </svg>
            </span>

            <span className="route-item__name">Wildfire</span>
          </div>
        );
      }

      switch (obj.display_category) {
        case 'closures':
          return (
            <div
              className="route-item route-item--major"
              key={index}
              onClick={() => eventFeatureHandler(obj)}
              onKeyDown={() => eventFeatureHandler(obj)}
              role="button"
              tabIndex={0}>

              <span className="route-item__icon">
                <FontAwesomeIcon icon={faMinusCircle} alt="closures"/>
              </span>

              <span className="route-item__name">Closure</span>
            </div>
          );

        case 'majorEvents':
          return (
            <div
              className="route-item route-item--major"
              key={index}
              onClick={() => eventFeatureHandler(obj)}
              onKeyDown={() => eventFeatureHandler(obj)}
              role="button"
              tabIndex={0}>

              <span className="route-item__icon">
                <svg width="18" height="19" viewBox="0 0 18 19" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                     alt="major delays" aria-hidden="true" focusable="false" role="img">
                  <path className="filter-item__icon__path"
                        d="M1.22269 6.84836L6.45493 1.61612C7.89977 0.171277 10.2423 0.171276 11.6872 1.61612L16.9194 6.84836C18.3642 8.2932 18.3642 10.6358 16.9194 12.0806L11.6872 17.3128C10.2423 18.7577 7.89977 18.7577 6.45493 17.3128L1.22269 12.0806C-0.222156 10.6358 -0.222157 8.2932 1.22269 6.84836ZM3.18478 8.81045C2.82357 9.17166 2.82357 9.7573 3.18478 10.1185L8.41702 15.3507C8.77823 15.712 9.36386 15.712 9.72507 15.3507L14.9573 10.1185C15.3185 9.7573 15.3185 9.17166 14.9573 8.81045L9.72507 3.57821C9.36386 3.217 8.77823 3.217 8.41702 3.57821L3.18478 8.81045Z"/>
                </svg>
              </span>

              <span className="route-item__name">Major delay</span>
            </div>
          );
        case 'minorEvents':
          return (
            <div
              className="route-item route-item--minor"
              key={index}
              onClick={() => eventFeatureHandler(obj)}
              onKeyDown={() => eventFeatureHandler(obj)}
              role="button"
              tabIndex={0}>

              <span className="route-item__icon">
                <svg width="18" height="16" viewBox="0 0 18 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                     alt="minor delays" aria-hidden="true" focusable="false" role="img">
                  <path className="filter-item__icon__path"
                        d="M15.501 0H2.50098C0.660978 0 -0.549022 1.65 0.250978 3.08L6.75098 14.77C7.66098 16.4 10.351 16.4 11.261 14.77L17.761 3.08C18.551 1.65 17.341 0 15.501 0ZM15.441 3.03L9.45098 13.81C9.45098 13.81 9.29098 14.01 8.94098 14.01C8.59098 14.01 8.46098 13.85 8.43098 13.81L2.59098 3.26C2.23098 2.61 2.48098 2 3.23098 2H14.961C15.551 2 15.741 2.51 15.451 3.03H15.441Z"/>
                </svg>
              </span>

              <span className="route-item__name">Minor delay</span>
            </div>
          );
        case 'roadConditions':
          return (
            <div
              className="route-item route-item--roadConditions"
              key={index}
              onClick={() => eventFeatureHandler(obj)}
              onKeyDown={() => eventFeatureHandler(obj)}
              role="button"
              tabIndex={0}>

              <span className="route-item__icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                     alt="road conditions" aria-hidden="true" focusable="false" role="img">
                  <path className="route-item__icon__path"
                        d="M19.5625 8.8925L11.1125 0.4425C10.4825 -0.1475 9.5125 -0.1475 8.8825 0.4425L0.4425 8.8925C-0.1475 9.5225 -0.1475 10.4925 0.4425 11.1225L8.8925 19.5725C9.5225 20.1625 10.4925 20.1625 11.1225 19.5725L19.5725 11.1225C20.1625 10.4925 20.1625 9.5225 19.5725 8.8925H19.5625ZM8.9425 10.4525L5.5625 13.8325C5.3125 14.0625 4.9225 14.0625 4.6725 13.8325L1.2925 10.4525C1.0625 10.2025 1.0625 9.8125 1.2925 9.5625L4.6725 6.1825C4.9225 5.9525 5.3125 5.9525 5.5625 6.1825L8.9425 9.5625C9.1725 9.8125 9.1725 10.2025 8.9425 10.4525ZM18.7225 10.4525L15.3425 13.8325C15.0925 14.0625 14.7025 14.0625 14.4525 13.8325L11.0725 10.4525C10.8425 10.2025 10.8425 9.8125 11.0725 9.5625L14.4525 6.1825C14.7025 5.9525 15.0925 5.9525 15.3425 6.1825L18.7225 9.5625C18.9525 9.8125 18.9525 10.2025 18.7225 10.4525Z"/>
                </svg>
              </span>

              <span className="route-item__name">Road condition</span>
            </div>
          );
        case 'futureEvents':
          return (
            <div
              className="route-item route-item--futureEvents"
              key={index}
              onClick={() => eventFeatureHandler(obj)}
              onKeyDown={() => eventFeatureHandler(obj)}
              role="button"
              tabIndex={0}>

              <span className="route-item__icon">
                <svg width="14" height="14" viewBox="5 6 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                     alt="future events" aria-hidden="true" focusable="false" role="img">
                  <path
                    d="M10 5.5C10.3984 5.5 10.75 5.85156 10.75 6.25V7H13.75V6.25C13.75 5.85156 14.0781 5.5 14.5 5.5C14.8984 5.5 15.25 5.85156 15.25 6.25V7L16.375 7C16.9844 7 17.5 7.51563 17.5 8.125V9.25L7 9.25V8.125C7 7.51562 7.49219 7 8.125 7H9.25V6.25C9.25 5.85156 9.57812 5.5 10 5.5ZM7 10L17.5 10V16.375C17.5 17.0078 16.9844 17.5 16.375 17.5H8.125C7.49219 17.5 7 17.0078 7 16.375L7 10ZM8.5 11.875V12.625C8.5 12.8359 8.66406 13 8.875 13H9.625C9.8125 13 10 12.8359 10 12.625V11.875C10 11.6875 9.8125 11.5 9.625 11.5H8.875C8.66406 11.5 8.5 11.6875 8.5 11.875ZM11.5 11.875V12.625C11.5 12.8359 11.6641 13 11.875 13L12.625 13C12.8125 13 13 12.8359 13 12.625V11.875C13 11.6875 12.8125 11.5 12.625 11.5L11.875 11.5C11.6641 11.5 11.5 11.6875 11.5 11.875ZM14.875 11.5C14.6641 11.5 14.5 11.6875 14.5 11.875V12.625C14.5 12.8359 14.6641 13 14.875 13H15.625C15.8125 13 16 12.8359 16 12.625V11.875C16 11.6875 15.8125 11.5 15.625 11.5H14.875ZM8.5 14.875V15.625C8.5 15.8359 8.66406 16 8.875 16H9.625C9.8125 16 10 15.8359 10 15.625V14.875C10 14.6875 9.8125 14.5 9.625 14.5H8.875C8.66406 14.5 8.5 14.6875 8.5 14.875ZM11.875 14.5C11.6641 14.5 11.5 14.6875 11.5 14.875V15.625C11.5 15.8359 11.6641 16 11.875 16H12.625C12.8125 16 13 15.8359 13 15.625V14.875C13 14.6875 12.8125 14.5 12.625 14.5L11.875 14.5ZM14.5 14.875V15.625C14.5 15.8359 14.6641 16 14.875 16H15.625C15.8125 16 16 15.8359 16 15.625V14.875C16 14.6875 15.8125 14.5 15.625 14.5H14.875C14.6641 14.5 14.5 14.6875 14.5 14.875Z"
                    fill="#474543"/>
                </svg>
              </span>

              <span className="route-item__name">Future event</span>
            </div>
          );
        case 'chainUps':
          return (
            <div
              className="route-item route-item--chainUps"
              key={index}
              onClick={() => eventFeatureHandler(obj)}
              onKeyDown={() => eventFeatureHandler(obj)}
              role="button"
              tabIndex={0}>

              <span className="route-item__icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5.05 4H9.52188C11.7719 4 13.6 5.86198 13.5719 8.15365C13.5719 10.1875 12.1375 11.9062 10.1969 12.25H10.1406C9.63438 12.3359 9.18438 11.9922 9.1 11.5052C9.01563 10.9896 9.35313 10.5312 9.83125 10.4453H9.8875C10.9844 10.2448 11.8 9.27083 11.8 8.15365C11.8 6.89323 10.7594 5.83333 9.52188 5.83333H5.05C3.8125 5.83333 2.8 6.89323 2.8 8.15365C2.8 9.27083 3.5875 10.2448 4.68438 10.4453H4.74063C5.21875 10.5312 5.55625 10.9896 5.47188 11.5052C5.3875 11.9922 4.9375 12.3359 4.43125 12.25H4.375C2.43438 11.9062 1 10.1875 1 8.15365C1 5.86198 2.8 4 5.05 4ZM14.9219 15H10.45C8.2 15 6.4 13.1667 6.4 10.875C6.4 8.84115 7.83438 7.1224 9.80313 6.77865H9.83125C10.3375 6.69271 10.7875 7.03646 10.8719 7.52344C10.9563 8.03906 10.6188 8.4974 10.1406 8.58333H10.0844C8.9875 8.78385 8.2 9.72917 8.2 10.875C8.2 12.1354 9.2125 13.1667 10.45 13.1667H14.9219C16.1875 13.1667 17.2 12.1354 17.2 10.875C17.2 9.72917 16.3844 8.78385 15.2875 8.58333H15.2313C14.7531 8.4974 14.4156 8.03906 14.5 7.52344C14.5844 7.03646 15.0344 6.69271 15.5406 6.77865H15.5969C17.5375 7.1224 19 8.84115 19 10.875C19 13.1667 17.1719 15 14.9219 15Z"
                    fill="#474543"/>
                </svg>
              </span>

              <span className="route-item__name">Commercial chain up</span>
            </div>
          );
        case 'advisory':
          return (
            <div
              className="route-item route-item--major"
              key={index}
              onClick={() => advisoryFeatureHandler(obj)}
              onKeyDown={() => advisoryFeatureHandler(obj)}
              role="button"
              tabIndex={0}>

              <span className="route-item__icon">
                <FontAwesomeIcon icon={faFlag} alt="advisories"/>
              </span>

              <span className="route-item__name">Advisory</span>
            </div>
          );
        case 'inlandFerry':
        case 'costalFerry':
          return (
            <div
              className="route-item route-item--ferries"
              key={index}
              onClick={() => ferryFeatureHandler(obj)}
              onKeyDown={() => ferryFeatureHandler(obj)}
              role="button"
              tabIndex={0}>

              <span className="route-item__icon">
                <FontAwesomeIcon icon={faFerry} alt="ferries"/>
              </span>

              <span className="route-item__name">Ferry travel</span>
            </div>
          );
      }
    });
  }

  // Main components
  return selectedRoute && (
    <React.Fragment>
      <div className={`route-details selected ${largeScreen ? '' : 'mobile'}`}>
        <div className="route-title">
          <div className="space-between-row route-tools">
            <span className={`route-index selected`}>{(selectedRoute.criteria === 'fastest') ? 'A' : 'B'}</span>

            {authContext.loginStateKnown &&
              <button
                className={`favourite-btn text-only-btn
                  ${selectedRoute.saved ? 'favourited' : ''}`}
                aria-label={`${selectedRoute.saved ? 'Remove favourite' : 'Add favourite'}`}
                onClick={favoriteHandler}>
                <FontAwesomeIcon icon={selectedRoute.saved ? faStar : faStarOutline}/>
                {selectedRoute.saved ? "Remove" : "Save"}
              </button>
            }
          </div>

          <div className="route-name-and-distance">
            <h4
              className="route-name">{selectedRoute.label ? selectedRoute.label : 'Route'} {(selectedRoute.criteria === 'fastest') ? 'A' : 'B'}</h4>
            <p className="route-distance">{Math.round(selectedRoute.distance)} km</p>
          </div>
          {selectedRoute.label &&
            <p className="route-alt-name">{getDefaultLabel()}</p>
          }
        </div>

        <p className="route-items-text">In order of appearance along your route:</p>

        <div className="route-items">
          {objList &&
            getObjectList()
          }
        </div>

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

        <RouteMap route={selectedRoute} showSavePopup={showSavePopup} setRouteMapImg={setRouteMapImg}/>
      </div>
    </React.Fragment>
  );
}
