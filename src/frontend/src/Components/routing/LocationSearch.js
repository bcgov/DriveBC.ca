// React
import React, { useState } from 'react';

// Redux
import { useDispatch } from 'react-redux';

// External imports
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import { getLocations } from '../data/locations.js';
import trackEvent from '../shared/TrackEvent.js';

// Styling
import './LocationSearch.scss';
import 'react-bootstrap-typeahead/css/Typeahead.css';

export default function LocationSearch(props) {
  /* Setup */
  // Props
  const { placeholder, location, action, myLocation, selectByDefault } = props;

  // Redux
  const dispatch = useDispatch();

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
