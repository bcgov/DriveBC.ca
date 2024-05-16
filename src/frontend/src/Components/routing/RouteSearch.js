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
  faLocationDot,
  faArrowUpArrowDown
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

// Styling
import './RouteSearch.scss';

export default function RouteSearch(props) {
  const { showFilterText } = props;

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
    <div className={'routing-outer-container'}>
      {showFilterText && !!searchLocationFrom.length && !!searchLocationTo.length &&
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

        {!!searchLocationFrom.length && !!searchLocationTo.length &&
          <Button className="swap-button" aria-label="Swap start and destination" onClick={() => swapHandler()}><FontAwesomeIcon icon={faArrowUpArrowDown} /></Button>
        }
      </div>
    </div>
  );
}
