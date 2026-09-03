// React
import React, {useCallback, useEffect, useRef, forwardRef, useContext, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { useClickAway } from '@uidotdev/usehooks';

// Routing
import { useSearchParams } from "react-router-dom";

// Internal imports
import { compareRoutes, getRoutes, shortenToOneDecimal } from '../data/routes';
import {
  clearSearchedRoutes,
  clearSelectedRoute,
  updateSelectedRoute,
  updateSearchedRoutes,
  updateSearchLocationFrom,
  updateSearchLocationTo,
  clearRouteDistance,
  updateShowRouteObjs
} from '../../slices/routesSlice'
import { fitMap, removeOverlays } from "../map/helpers";
import { applyDefaultRouteLayers } from "../map/enums";
import { MapContext } from "../../App";
import LocationSearch from './LocationSearch';
import NoRouteFound from './NoRouteFound';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleDot,
  faLocationDot
} from '@fortawesome/pro-solid-svg-icons';
import { faArrowUpArrowDown, faMagnifyingGlass, faXmark} from '@fortawesome/pro-regular-svg-icons';
import Spinner from 'react-bootstrap/Spinner';

// Styling
import './RouteSearch.scss';

const RouteSearch = forwardRef((props, ref) => {
  // Props
  const { showFilterText, showSpinner, onShowSpinnerChange, mapRef, myLocation, mapView, resetClickedStates } = props;

  // Routing
  const [searchParams, setSearchParams] = useSearchParams();

  // Context
  const { mapContext, setMapContext } = useContext(MapContext);

  // Redux
  const dispatch = useDispatch();
  const { favRoutes, searchLocationFrom, searchLocationTo, selectedRoute, searchedRoutes, routeDistance } = useSelector(useCallback(memoize(state => ({
    favRoutes: state.user.favRoutes,
    searchLocationFrom: state.routes.searchLocationFrom,
    searchLocationTo: state.routes.searchLocationTo,
    selectedRoute: state.routes.selectedRoute,
    searchedRoutes: state.routes.searchedRoutes,
    routeDistance: state.routes.routeDistance
  }))));

  const hasFromLocation = searchLocationFrom && !!searchLocationFrom.length;
  const hasToLocation = searchLocationTo && !!searchLocationTo.length;
  const validSearch = hasFromLocation && hasToLocation;
  const hasLocation = hasFromLocation || hasToLocation;

  // openSearch when either location is populated
  const [openSearch, setOpenSearch] = useState(hasLocation);

  // Desktop (map): collapse search when clicking outside while a location is set
  const clickAwayRef = useClickAway(() => {
    if (mapRef && !hasLocation && openSearch) {
      setOpenSearch(false);
    }
  });

  const setContainerRef = useCallback((node) => {
    clickAwayRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref, clickAwayRef]);

  // Refs
  const isInitialMount = useRef(true);
  const isInitialMountSpinner = useRef(true);

  // Helpers
  const updateSearchParams = () => {
    if (searchLocationFrom && searchLocationFrom.length > 0) {
      searchParams.set('start', searchLocationFrom[0].label);
    } else {
      searchParams.delete('start');
    }

    if (searchLocationTo && searchLocationTo.length > 0) {
      searchParams.set('end', searchLocationTo[0].label);
    } else {
      searchParams.delete('end');
    }

    setSearchParams(searchParams, { replace: true });
  }

  const updateSearch = () => {
    updateSearchParams();

    // Only update search params on first load
    if (isInitialMount.current) {
      isInitialMount.current = false;

      // Unless coming from notifications, then load route
      if (!searchParams.get('route_distance')) {
        return;
      }
    }

    if (validSearch) {
      onShowSpinnerChange(true);

    } else {
      dispatch(clearSearchedRoutes());
      dispatch(updateShowRouteObjs(false));
      dispatch(clearSelectedRoute());
      removeOverlays(mapRef);
    }
  }

  useEffect(() => {
    updateSearch();
  }, [searchLocationFrom, searchLocationTo]);

  useEffect(() => {
    if (isInitialMountSpinner.current) { // Do nothing on first load
      isInitialMountSpinner.current = false;
      return;
    }

    if (showSpinner) {
      // Reset clicked state on map before fetching new route
      if (resetClickedStates) {
        resetClickedStates();
      }

      const firstPoint = searchLocationFrom[0].geometry.coordinates.toString();
      const secondPoint = searchLocationTo[0].geometry.coordinates.toString();

      getRoutes(firstPoint, secondPoint, favRoutes).then((routes) => {
        // Select shortest route if the distance matches
        if (routes.length > 1 && routeDistance === shortenToOneDecimal(routes[1].distance)) {
          dispatch(updateSelectedRoute(routes[1]));

        // Select fastest route by default
        } else {
          dispatch(updateSelectedRoute(routes[0]));
        }

        // Enable default route layers from any page (map or delays list)
        let nextMapContext = applyDefaultRouteLayers(mapContext);

        // Fit map on routes after user input or notification link
        const fromNotification = searchParams.get('route_distance');
        if (nextMapContext.pendingRouteFit || fromNotification) {
          if (fromNotification) {
            searchParams.delete('route_start');
            searchParams.delete('route_start_point');
            searchParams.delete('route_end');
            searchParams.delete('route_end_point');
            searchParams.delete('route_distance');
            setSearchParams(searchParams);
          }

          fitMap(routes, mapView);
          nextMapContext = {
            ...nextMapContext,
            pendingRouteFit: false
          };
        }

        setMapContext(nextMapContext);
        localStorage.setItem('mapContext', JSON.stringify(nextMapContext));

        dispatch(clearRouteDistance());
        dispatch(updateSearchedRoutes(routes));
        onShowSpinnerChange(false);
      });
    }
  }, [showSpinner]);

  // Handlers
  const resetRouteParams = () => {
    if (resetClickedStates) {
      resetClickedStates();
      dispatch(updateShowRouteObjs(false));
    }

    searchParams.delete('type');
    searchParams.delete('id');
    searchParams.delete('display_category');
    setSearchParams(searchParams, { replace: true });
  }

  const swapHandler = () => {
    resetRouteParams();

    dispatch(updateSearchLocationFrom(searchLocationTo));
    dispatch(updateSearchLocationTo(searchLocationFrom));
  }

  const clearHandler = () => {
    resetRouteParams();

    dispatch(updateSearchLocationFrom([]));
    dispatch(updateSearchLocationTo([]));
  }

  const selectRouteOption = (route) => {
    if (!compareRoutes(route, selectedRoute)) {
      dispatch(updateSelectedRoute(route));
    }
  }

  // Rendering
  if (mapRef && !openSearch) {
    return (
      <div ref={setContainerRef} className="routing routing-outer-container routing-outer-container--collapsed">
        <button
          type="button"
          className="search-trigger btn"
          aria-label="search location"
          onClick={() => setOpenSearch(true)}>
          <FontAwesomeIcon icon={faMagnifyingGlass} /> Focus the info: Enter your trip here
        </button>
      </div>
    );
  }

  return (
    <div ref={setContainerRef} className={`routing routing-outer-container${mapRef ? ' routing-outer-container--expanded' : ''}`}>
      {showFilterText && selectedRoute &&
        <p className="routing-caption">
          {mapRef
            ? 'Map and site results filtered by trip: '
            : 'Results below are filtered by this route:'}
        </p>
      }

      <div className="routing-container">
        <div className={"typeahead-container typeahead-container--from stacked"}>
          <span className="location-marker location-marker--from">
            <FontAwesomeIcon icon={faCircleDot} />
          </span>

          <LocationSearch
            placeholder={'Search starting location'}
            location={searchLocationFrom}
            myLocation={myLocation}
            action={updateSearchLocationFrom}
            // Select by default if from location is empty
            selectByDefault={searchLocationFrom.length === 0 && !searchParams.get('start')}
            inputProps={{
              'aria-label': 'input field for starting location search',
              'id': 'location-search-starting-id',
            }}
          />
        </div>

        <div className="typeahead-container typeahead-container--to stacked">
          <span className="location-marker location-marker--to">
            <FontAwesomeIcon icon={faLocationDot} />
          </span>

          <LocationSearch
            placeholder={'Search destination location'}
            location={searchLocationTo}
            action={updateSearchLocationTo}
            // Select by default if from location exists and to location is empty
            selectByDefault={searchLocationFrom.length > 0 && searchLocationTo.length === 0 && !searchParams.get('end')}
            inputProps={{
              'aria-label': 'input field for ending location search',
              'id': 'location-search-ending-id',
            }}
          />

          {showSpinner &&
            <Spinner className="typeahead-spinner" size="sm" animation="border" />
          }
        </div>

        {hasLocation &&
          <div className="route-search-actions-container">
            {!mapRef && searchedRoutes && searchedRoutes.length > 0 &&
              <div className="route-alt-options">
                {searchedRoutes.map((route, index) => {
                  const isSelected = compareRoutes(route, selectedRoute);
                  const routeLabel = route.criteria === 'fastest' ? 'A' : 'B';
                  const roundedDistance = Math.round(route.distance);

                  return (
                    <button
                      key={index}
                      type="button"
                      className={`route-alt-option${isSelected ? ' selected' : ''}`}
                      onClick={() => selectRouteOption(route)}
                      aria-label={`Route ${routeLabel}, ${roundedDistance} kilometers`}
                      aria-pressed={isSelected}>
                      {searchedRoutes.length > 1 &&
                        <span className="route-alt-option__label">{routeLabel}</span>
                      }
                      <span className="route-alt-option__distance">{roundedDistance} km</span>
                    </button>
                  );
                })}
              </div>
            }

            <div className="route-search-actions">
              {validSearch &&
                <button type="button" className="route-search-link" onClick={() => swapHandler()}>
                  <FontAwesomeIcon icon={faArrowUpArrowDown} /> Swap
                </button>
              }

              <button type="button" className="route-clear-link" onClick={() => clearHandler()}>
                <FontAwesomeIcon icon={faXmark} /> Clear
              </button>
            </div>
          </div>
        }

        {searchedRoutes &&
          <NoRouteFound searchedRoutes={searchedRoutes} searchLocationFrom={searchLocationFrom} searchLocationTo={searchLocationTo}/>
        }
      </div>
    </div>
  );
});

RouteSearch.displayName = 'RouteSearch';
export default RouteSearch;
