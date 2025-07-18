// React
import React, {useContext, useEffect, useState} from 'react';

// Routing
import { useSearchParams } from "react-router-dom";

// Redux
import { useDispatch } from 'react-redux';

// External imports
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import { MapContext } from "../../App";
import { getLocations } from '../data/locations.js';
import trackEvent from '../shared/TrackEvent.js';

// Styling
import './LocationSearch.scss';
import 'react-bootstrap-typeahead/css/Typeahead.css';

export default function LocationSearch(props) {
  /* Setup */
  // Props
  const { placeholder, location, action, myLocation, selectByDefault } = props;
  const isStartLocation = placeholder === 'Search starting location';

  // Context
  const { mapContext, setMapContext } = useContext(MapContext);

  // Redux
  const dispatch = useDispatch();

  // Routing
  const [searchParams, _setSearchParams] = useSearchParams();

  // State
  const [minLength, setMinLength] = useState(3);
  const [cacheOptions, setCacheOptions] = useState(true);
  const [isSearching, setSearching] = useState(false);
  const [options, setLocationOptions] = useState([]);

  // Helpers
  const setSelectedLocation = payload => {
    if (payload.length > 0) {
      window.document.activeElement.blur(); // De-focus textbox
    }
    dispatch(action(payload));

    // Pending route fit after user input
    const newContext = {
      ...mapContext,
      pendingRouteFit: true
    };

    // Pending pan to start location after user input
    if (isStartLocation) {
      newContext.pendingStartPan = true;
    }

    setMapContext(newContext);
  };

  const loadLocationOptions = locationInput => {
    setSearching(true);
    getLocations(locationInput).then(locationsData => {
      setLocationOptions(
        locationsData.features.map(feature => {
          return {
            ...feature,
            label: feature.properties.fullAddress,
          };
        }),
      );
      setSearching(false);
    });
  };

  const populateMylocation = locationInput => {
    if (myLocation) {
      setCacheOptions(false);
      setMinLength(0);
      setLocationOptions([{ ...myLocation, label: "Current location"}]);
    }
  }

  // Populate location based on shared search params
  const initializeSearchLocation = () => {
    const locationText = searchParams.get((isStartLocation ? 'start' : 'end'));

    if (locationText) {
      if (locationText === 'null') {
        dispatch(action([]));

      } else {
        setSearching(true);
        getLocations(locationText).then(locationsData => {  // Fetch locations from text
          for (let i=0; i < locationsData.features.length; i++) {
            const feature = locationsData.features[i];
            if (feature.properties.fullAddress === locationText) {  // Dispatch exact match
              dispatch(action([{
                ...feature,
                label: feature.properties.fullAddress,
              }]));
              break;
            }
          }
          setSearching(false);
        });
      }
    }
  }

  useEffect(() => {
    initializeSearchLocation()
  }, []);

  // Rendering
  return (
    <AsyncTypeahead
      autoFocus={selectByDefault}
      selected={location}
      filterBy={() => true}
      id="location-search-typeahead"
      isLoading={isSearching}
      labelKey="label"
      minLength={minLength}
      onChange={setSelectedLocation}
      onSearch={loadLocationOptions}
      onFocus={populateMylocation}
      onBlur={() => {
        if (location && location.length > 0) {
          trackEvent(
            'blur',
            'route search',
            'location search',
            location[0].label,
          );
        }
      }}
      options={options}
      placeholder={placeholder}
      highlightOnlyResult={true}
      useCache={cacheOptions}
      inputProps={{
        'aria-label': 'input field for location ' + placeholder,
        ...props.inputProps,

      }}
      selectHint={(shouldSelect, e) => {
        // Select the hint if the user hits 'enter'
        return e.keyCode === 13 || shouldSelect;
      }}
      renderMenuItemChildren={location => (
        <div>
          <span>{location.label}</span>
        </div>
      )}
    >
    {({ onClear, selected }) => (
      <>
        {!!selected.length &&
          <button
            className='clear-btn'
            aria-label={'Clear ' + placeholder}
            onClick={onClear}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        }
      </>
    )}
    </AsyncTypeahead>
  );
}
