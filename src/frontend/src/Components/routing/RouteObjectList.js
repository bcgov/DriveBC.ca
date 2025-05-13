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

// Internal imports
import { AlertContext, AuthContext, FeatureContext } from '../../App';
import { removeRoute, saveRoute } from "../data/routes";
import { collator } from "../data/webcams";
import { populateRouteProjection } from '../map/helpers';
import { eventClickHandler } from "../map/handlers/click";
import RouteMap from './RouteMap';

// Styling
import './RouteObjectList.scss';
import 'react-loading-skeleton/dist/skeleton.css'

export default function RouteObjectList(props) {
  /* Setup */
  // Misc
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Props
  const { setShowRouteObjs, clickedFeatureRef, updateClickedFeature } = props;

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
  const [objList, setObjList] = useState();

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

  useEffect(() => {
    rankObjectList();
  }, []);

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
    const objs = [...filteredEvents, ...filteredFerries, ...filteredAdvisories];
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
      toggleAuthModal('Sign In');
      dispatch(updatePendingAction({
        action: 'showSavePopup'
      }));
    }
  }

  const featureHandler = (event) => {
    if (featureContext.events && event.id in featureContext.events) {
      eventClickHandler(
        featureContext.events[event.id],
        clickedFeatureRef,
        updateClickedFeature,
        false
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

  const getObjectList = (objs) => {
    return objs.map((obj, index) => {
      switch (obj.display_category) {
        case 'closures':
          return (
            <div
              className="route-item route-item--major"
              key={index}
              onClick={() => featureHandler(obj)}
              onKeyPress={() => featureHandler(obj)}
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
              onClick={() => featureHandler(obj)}
              onKeyPress={() => featureHandler(obj)}
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
              onClick={() => featureHandler(obj)}
              onKeyPress={() => featureHandler(obj)}
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
              onClick={() => featureHandler(obj)}
              onKeyPress={() => featureHandler(obj)}
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
        case 'chainUps':
          return (
            <div
              className="route-item route-item--chainUps"
              key={index}
              onClick={() => featureHandler(obj)}
              onKeyPress={() => featureHandler(obj)}
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
        default:
          // Ferries
          if (obj.vessels) {
            return (
              <div
                className="route-item route-item--ferries"
                key={index}
                onClick={() => featureHandler(obj)}
                onKeyPress={() => featureHandler(obj)}
                role="button"
                tabIndex={0}>

                <span className="route-item__icon">
                  <FontAwesomeIcon icon={faFerry} alt="inland ferries"/>
                </span>

                <span className="route-item__name">Ferry travel</span>
              </div>
            );

          // Advisories
          } else {
            return (
              <div
                className="route-item route-item--major"
                key={index}
                onClick={() => featureHandler(obj)}
                onKeyPress={() => featureHandler(obj)}
                role="button"
                tabIndex={0}>

                <span className="route-item__icon">
                  <FontAwesomeIcon icon={faFlag} alt="advisories"/>
                </span>

                <span className="route-item__name">Advisory</span>
              </div>
            );
          }
      }
    });
  }

  // Main components
  return selectedRoute && (
    <React.Fragment>
      <Button variant="primary-outline" className="btn-outline-primary back-to-routes" onClick={() => setShowRouteObjs(false)}>
        <FontAwesomeIcon icon={faArrowLeft}/>
        Routes
      </Button>

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
            getObjectList(objList)
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
