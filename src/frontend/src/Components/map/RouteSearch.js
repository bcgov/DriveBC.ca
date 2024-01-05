// React
import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'

// Components and functions
import { getRoute } from '../data/routes.js';
import { clearSelectedRoute, updateSearchLocationFrom, updateSearchLocationTo, updateSelectedRoute } from '../../slices/routesSlice'
import LocationSearch from './LocationSearch.js';

// Styling
import './RouteSearch.scss';

export default function RouteSearch() {
  // Redux
  const dispatch = useDispatch();
  const { searchLocationFrom, searchLocationTo } = useSelector(useCallback(memoize(state => ({
    searchLocationFrom: state.routes.searchLocationFrom,
    searchLocationTo: state.routes.searchLocationTo,
  }))));

  // Refs
  const isInitialMount = useRef(true);

  // useEffect hooks
  useEffect(() => {
    if (isInitialMount.current) { // Do nothing on first load
      isInitialMount.current = false;
      return;
    }

    if (searchLocationFrom && searchLocationFrom.length && searchLocationTo && searchLocationTo.length) {
      const firstPoint = searchLocationFrom[0].geometry.coordinates.toString();
      const secondPoint = searchLocationTo[0].geometry.coordinates.toString();

      const points = firstPoint + ',' + secondPoint;

      getRoute(points).then(routeData => {
        dispatch(updateSelectedRoute(routeData));
      });

    } else {
      dispatch(clearSelectedRoute());
    }
  }, [searchLocationFrom, searchLocationTo]);

  // Rendering
  return (
    <div className="routing-container">
      <div className="typeahead-container">
        <LocationSearch location={searchLocationFrom} action={updateSearchLocationFrom} />
      </div>

      {(!!searchLocationFrom.length || !!searchLocationTo.length) &&
        <div className="typeahead-container typeahead-container-two">
          <LocationSearch location={searchLocationTo} action={updateSearchLocationTo} />
        </div>
      }
    </div>
  );
}
