// React
import React, {useCallback, useEffect, useRef, forwardRef, useContext} from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'

// Routing
import { useSearchParams } from "react-router-dom";

// Internal imports
import { getRoutes, shortenToOneDecimal } from '../data/routes.js';
import {
  clearSearchedRoutes,
  clearSelectedRoute,
  updateSelectedRoute,
  updateSearchedRoutes,
  updateSearchLocationFrom,
  updateSearchLocationTo, clearRouteDistance
} from '../../slices/routesSlice'
import { fitMap, removeOverlays } from "../map/helpers";
import { MapContext } from "../../App";
import LocationSearch from './LocationSearch.js';
import NoRouteFound from './NoRouteFound';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleDot,
  faLocationDot,
  faArrowUpArrowDown
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
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

  const validSearch = searchLocationFrom && !!searchLocationFrom.length && searchLocationTo && !!searchLocationTo.length;

  // Refs
  const isInitialMount = useRef(true);
  const isInitialMountSpinner = useRef(true);

  // Helpers
  const updateSearchParams = () => {
    if (searchLocationFrom && searchLocationFrom.length > 0) {
      searchParams.set('start', searchLocationFrom[0].label);
    } else {
      searchParams.set('start', null);
    }

    if (searchLocationTo && searchLocationTo.length > 0) {
      searchParams.set('end', searchLocationTo[0].label);
    } else {
      searchParams.set('end', null);
    }

    setSearchParams(searchParams, { replace: true });
  }

  const updateSearch = () => {
    updateSearchParams();

    if (isInitialMount.current) { // Only update search params on first load
      isInitialMount.current = false;
      return;
    }

    if (validSearch) {
      onShowSpinnerChange(true);

    } else {
      dispatch(clearSearchedRoutes());
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

        // Fit map on routes only after user input
        if (mapContext && mapContext.pendingRouteFit) {
          fitMap(routes, mapView);
          setMapContext({
            ...mapContext,
            pendingRouteFit: false
          });
        }

        dispatch(clearRouteDistance());
        dispatch(updateSearchedRoutes(routes));
        onShowSpinnerChange(false);
      });
    }
  }, [showSpinner]);

  // Handlers
  const swapHandler = () => {
    searchParams.delete('type');
    searchParams.delete('id');
    searchParams.delete('display_category');
    setSearchParams(searchParams, { replace: true });

    dispatch(updateSearchLocationFrom(searchLocationTo));
    dispatch(updateSearchLocationTo(searchLocationFrom));
  }

  // Rendering
  return (
    <div ref={ref} className='routing routing-outer-container'>
      {showFilterText && selectedRoute &&
        <p className={'routing-caption'}>Results below are filtered by this route:</p>
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

        {searchedRoutes &&
          <NoRouteFound searchedRoutes={searchedRoutes} searchLocationFrom={searchLocationFrom} searchLocationTo={searchLocationTo}/>
        }

        {validSearch &&
          <Button className="swap-button" aria-label="Swap start and destination" onClick={() => swapHandler()}><FontAwesomeIcon icon={faArrowUpArrowDown} /></Button>
        }
      </div>
    </div>
  );
});

RouteSearch.displayName = 'RouteSearch';
export default RouteSearch;
