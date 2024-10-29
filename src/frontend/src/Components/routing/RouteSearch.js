// React
import React, { useCallback, useEffect, useRef, forwardRef } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'

// Internal imports
import { getRoute } from '../data/routes.js';
import {
  clearSearchedRoutes,
  clearSelectedRoute,
  updateSelectedRoute,
  updateSearchedRoutes,
  updateSearchLocationFrom,
  updateSearchLocationTo
} from '../../slices/routesSlice'
import { removeOverlays } from "../map/helpers";
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
  const { showFilterText, showSpinner, onShowSpinnerChange, mapRef } = props;

  // Redux
  const dispatch = useDispatch();
  const { searchLocationFrom, searchLocationTo, selectedRoute, searchedRoutes } = useSelector(useCallback(memoize(state => ({
    searchLocationFrom: state.routes.searchLocationFrom,
    searchLocationTo: state.routes.searchLocationTo,
    selectedRoute: state.routes.selectedRoute,
    searchedRoutes: state.routes.searchedRoutes
  }))));

  const validSearch = searchLocationFrom && !!searchLocationFrom.length && searchLocationTo && !!searchLocationTo.length;

  // Refs
  const isInitialMount = useRef(true);
  const isInitialMountSpinner = useRef(true);

  // useEffect hooks
  useEffect(() => {
    if (isInitialMount.current) { // Do nothing on first load
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
  }, [searchLocationFrom, searchLocationTo]);

  const getRoutes = async () => {
    const firstPoint = searchLocationFrom[0].geometry.coordinates.toString();
    const secondPoint = searchLocationTo[0].geometry.coordinates.toString();

    const points = firstPoint + ',' + secondPoint;

    const routes = [];
    const fastestRoute = await getRoute(points);
    if (fastestRoute && fastestRoute.routeFound) {
      routes.push(fastestRoute);
    }

    const shortestRoute = await getRoute(points, true);
    if (shortestRoute && shortestRoute.routeFound) {
      routes.push(shortestRoute);
    }

    return routes;
  }

  useEffect(() => {
    if (isInitialMountSpinner.current) { // Do nothing on first load
      isInitialMountSpinner.current = false;
      return;
    }

    if (showSpinner) {
      getRoutes().then((routes) => {
        if (routes.length) {
          dispatch(updateSelectedRoute(routes[0]));
        }

        dispatch(updateSearchedRoutes(routes));
        onShowSpinnerChange(false);
      });
    }
  }, [showSpinner]);

  // Handlers
  const swapHandler = () => {
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
            action={updateSearchLocationFrom}
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
          <NoRouteFound searchedRoutes={searchedRoutes} />
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
