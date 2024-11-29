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
import { createSearchParams, useNavigate, useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFerry,
  faStar,
  faVideo,
  faFlag,
  faLocationDot
} from '@fortawesome/pro-solid-svg-icons';
import { faStar as faStarOutline, faCheck, faMinusCircle } from '@fortawesome/pro-regular-svg-icons';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Skeleton from 'react-loading-skeleton'

// Internal imports
import { AlertContext, AuthContext } from '../../App';
import {getRoute, removeRoute, saveRoute} from "../data/routes";
import { addCameraGroups } from "../data/webcams";
import { getEventCounts } from "../data/events";
import { getAdvisoryCounts } from "../data/advisories";
import { compareRouteDistance, filterAdvisoryByRoute } from '../map/helpers';
import * as dataLoaders from '../map/dataLoaders'
import * as slices from '../../slices';
import RouteMap from './RouteMap';

// Styling
import './RouteDetails.scss';
import 'react-loading-skeleton/dist/skeleton.css'

export default function RouteDetails(props) {
  /* Setup */
  // Props
  const { route, isPanel, setRouteFavCams, setRouteLabel, index, onMobile } = props;

  // Context
  const { authContext, setAuthContext } = useContext(AuthContext);
  const { setAlertMessage } = useContext(AlertContext);

  // Ref
  const workerRef = useRef();

  // Navigation
  const navigate = useNavigate();
  const [_, setSearchParams] = useSearchParams();

  // Redux
  const dispatch = useDispatch();
  const {
    feeds: {
      cameras: { list: cameras, filteredList: filteredCameras, filterPoints: camFilterPoints },
      events: { list: events, filteredList: filteredEvents, filterPoints: eventFilterPoints },
    },
    advisories: { list: advisories, filteredList: filteredAdvisories, filterPoints: advisoryFilterPoints },
    routes: { searchLocationFrom, searchLocationTo, selectedRoute },
    user: { favCams, pendingAction }

  } = useSelector(
    useCallback(
      memoize(state => ({
        feeds: {
          cameras: state.feeds.cameras,
          events: state.feeds.events,
        },
        advisories: state.cms.advisories,
        routes: state.routes,
        user: state.user
      })),
    ),
  );

  // States
  const [eventCount, setEventCount] = useState();
  const [advisoryCount, setAdvisoryCount] = useState();
  const [nickName, setNickName] = useState('');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [routeMapImg, setRouteMapImg] = useState(); // for map snapshot
  const [filteredFavCams, setFilteredFavCams] = useState();

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

  // Effects
  useEffect(() => {
    // Create a new worker if it doesn't exist
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../map/filterRouteWorker.js', import.meta.url));

      // Set up event listener for messages from the worker
      workerRef.current.onmessage = function (event) {
        const { data, filteredData, route, action } = event.data;

        // Data specific to the RouteDetails component
        if (action === 'setEventCount') {
          setEventCount(getEventCounts(filteredData));

        } else if (action === 'setFilteredFavCams') {
          setFilteredFavCams(filteredData);

        // Data to be updated via dispatch
        } else {
          dispatch(
            slices[action]({
              list: data,
              filteredList: filteredData,
              filterPoints: route ? route.points : null,
              timeStamp: new Date().getTime()
            })
          );
        }
      };
    }

    const routeData = selectedRoute && selectedRoute.routeFound ? selectedRoute : null;
    const displayError = () => {};

    dataLoaders.loadAdvisories(routeData, advisories, filteredAdvisories, advisoryFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadCameras(routeData, cameras, filteredCameras, camFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadEvents(routeData, events, filteredEvents, eventFilterPoints, dispatch, displayError, workerRef.current);

    if (pendingAction && pendingAction.action === 'showSavePopup') {
      setShowSavePopup(true);
      dispatch(resetPendingAction());
    }

    // Cleanup function to terminate the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

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
    if (route.searchTimestamp !== selectedRoute.searchTimestamp){
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
    let searchedRoutesPayload = route.criteria === 'fastest' ? // Fastest before shortest
      [routePayload, alternateRoute] : [alternateRoute, routePayload];

    const isSameRoute = compareRouteDistance(routePayload, alternateRoute);
    if(isSameRoute){
      searchedRoutesPayload = searchedRoutesPayload?.filter(route =>
        Object.prototype.hasOwnProperty.call(route, 'id')
      );
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

    navigate({
      pathname: '/',
      search: `?${createSearchParams({
        type: "route",
        searchTimestamp: route.searchTimestamp,
      })}`
    });
  }

  /* Rendering */
  // Subcomponents
  const getDefaultLabel = () => {
    if (route.start && route.end) {
      return route.start + ' to ' + route.end;
    }

    if (searchLocationFrom && searchLocationFrom.length && searchLocationTo && searchLocationTo.length) {
      return searchLocationFrom[0].label + ' to ' + searchLocationTo[0].label;
    }
  }

  // Main components
  return route && (
    <div
      className={`route-details ${isPanel && route.searchTimestamp === selectedRoute.searchTimestamp ? 'selected' : ''} ${onMobile ? 'mobile' : ''}`}
      tabIndex={isPanel ? 0 : null}
      onClick={isPanel ? switchRouteHandler : null}
      onKeyPress={isPanel ? switchRouteHandler : null}>

      <div className="route-title">
        <div className="space-between-row route-tools">
          {isPanel &&
            <span className={`route-index ${route.searchTimestamp === selectedRoute.searchTimestamp ? 'selected' : ''}`}>{index + 1}</span>
          }

          {isPanel && authContext.loginStateKnown &&
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
          <h4 className="route-name">{route.label ? route.label : getDefaultLabel()}</h4>
          <p className="route-distance">{Math.round(route.distance)} km</p>
        </div>
        {route.label &&
          <p className="route-alt-name">{getDefaultLabel()}</p>
        }
      </div>

      <div className="route-disclosures">
        {eventCount
          ? (eventCount.closures > 0 &&
            <div className="route-pill route-pill--closures">
                <span className="route-item__icon">
                  <FontAwesomeIcon icon={faMinusCircle} alt="closures"/>
                </span>
              <span className="route-item__count">
                  {eventCount.closures}
                </span>
              <span className="route-item__name">
                  {eventCount.closures > 1 ? ' Closures' : ' Closure'}
                </span>
            </div>
          )
          : <Skeleton width={120}/>
        }

        {!isNaN(advisoryCount)
          ? (advisoryCount > 0 &&
            <div className="route-pill route-pill--advisories">
                <span className="route-item__icon">
                  <FontAwesomeIcon icon={faFlag} alt="inland ferries"/>
                </span>
              <span className="route-item__count">
                  {advisoryCount}
                </span>
              <span className="route-item__name">
                  {advisoryCount > 1 ? ' Advisories' : ' Advisory'}
                </span>
            </div>
          )
          : <Skeleton width={120}/>
        }
      </div>

      <div className="route-items">
        {(eventCount && eventCount.majorEvents > 0) &&
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
            <span className="route-item__name">Major delays</span>
          </div>
        }

        {(eventCount && eventCount.minorEvents > 0) &&
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
            <span className="route-item__name">Minor delays</span>
          </div>
        }

        {(eventCount && eventCount.roadConditions > 0) &&
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
            <span className="route-item__name">Road conditions</span>
          </div>
        }

        {(eventCount && eventCount.ferries > 0) &&
          <div className="route-item route-item--ferries">
            <span className="route-item__count">
              {eventCount.ferries}
            </span>
            <span className="route-item__icon">
              <FontAwesomeIcon icon={faFerry} alt="inland ferries"/>
            </span>
            <span className="route-item__name">Inland Ferry</span>
          </div>
        }
        {!eventCount && <Skeleton height={64}/>}
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
              <span>{filteredFavCams.length === 0 ? 'No favourites on this route' : 'Favourites on this route'}</span>
            </button>
            : <Skeleton width={200}/>
          }

          <button
            className={`favourite-btn text-only-btn
                ${(route.saved || !isPanel) ? 'favourited' : ''}`}
            aria-label="Remove favourite"
            onClick={favoriteHandler}>
            <FontAwesomeIcon icon={faStar}/>
            <span>Remove</span>
          </button>
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
  );
}
