// React
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'

// Components and functions
import { getRoute } from '../data/routes.js';
import { clearSelectedRoute, updateSearchLocationFrom, updateSearchLocationTo, updateSelectedRoute } from '../../slices/routesSlice'
import LocationSearch from './LocationSearch.js';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleDot,
  faLocationDot
} from '@fortawesome/free-solid-svg-icons';
import { faArrowUpArrowDown } from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

// Styling
import './RouteSearch.scss';

export default function RouteSearch(props) {
  // Redux
  const dispatch = useDispatch();
  const { searchLocationFrom, searchLocationTo } = useSelector(useCallback(memoize(state => ({
    searchLocationFrom: state.routes.searchLocationFrom,
    searchLocationTo: state.routes.searchLocationTo,
  }))));

  // useState hooks
  const [showSpinner, setShowSpinner] = useState(false);

  // Refs
  const isInitialMount = useRef(true);
  const isInitialMountSpinner = useRef(true);

  // useEffect hooks
  useEffect(() => {
    if (isInitialMount.current) { // Do nothing on first load
      isInitialMount.current = false;
      return;
    }

    if (searchLocationFrom && searchLocationFrom.length && searchLocationTo && searchLocationTo.length) {
      setShowSpinner(true);

    } else {
      dispatch(clearSelectedRoute());
    }
  }, [searchLocationFrom, searchLocationTo]);

  useEffect(() => {
    if (isInitialMountSpinner.current) { // Do nothing on first load
      isInitialMountSpinner.current = false;
      return;
    }

    if (showSpinner) {
      const firstPoint = searchLocationFrom[0].geometry.coordinates.toString();
      const secondPoint = searchLocationTo[0].geometry.coordinates.toString();

      const points = firstPoint + ',' + secondPoint;

      getRoute(points).then(routeData => {
        dispatch(updateSelectedRoute(routeData));
        setShowSpinner(false);
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
    <div className="routing-container">
      <div className={"typeahead-container typeahead-container--from" + ((!!searchLocationFrom.length || !!searchLocationTo.length) ? ' stacked' : '')}>
        {!!searchLocationFrom.length &&
          <span className="location-marker location-marker--from">
            <FontAwesomeIcon icon={faCircleDot} />
          </span>
        }

        <LocationSearch placeholder={'Find a location'} location={searchLocationFrom} action={updateSearchLocationFrom} />
      </div>

      {!!searchLocationFrom.length &&
        <div className="typeahead-container typeahead-container--to stacked">
          <span className="location-marker location-marker--to">
            <FontAwesomeIcon icon={faLocationDot} />
          </span>

          <LocationSearch placeholder={'Find a destination'} location={searchLocationTo} action={updateSearchLocationTo} />

          {showSpinner &&
            <Spinner className="typeahead-spinner" size="sm" animation="border" />
          }
        </div>
      }

      {!!searchLocationFrom.length && !!searchLocationTo.length &&
        <Button className="swap-button" onClick={() => swapHandler()}><FontAwesomeIcon icon={faArrowUpArrowDown} /></Button>
      }
    </div>
  );
}
