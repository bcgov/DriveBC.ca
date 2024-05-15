// React
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

// react-bootstrap-typeahead
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';

// Components and functions
import { getLocations } from '../data/locations.js';
import trackEvent from '../shared/TrackEvent.js';
// Styling
import './LocationSearch.scss';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

export default function LocationSearch(props) {
  // Redux
  const dispatch = useDispatch();

  const { placeholder, location, action } = props;

  const [isSearching, setSearching] = useState(false);
  const [options, setLocationOptions] = useState([]);

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

  // Rendering
  return (
    <AsyncTypeahead
      selected={location}
      filterBy={() => true}
      id="location-search-typeahead"
      isLoading={isSearching}
      labelKey="label"
      minLength={3}
      onChange={setSelectedLocation}
      onSearch={loadLocationOptions}
      onBlur={() => {
        if (location && location.length > 0) {
          trackEvent(
            'blur',
            'route search',
            'location search',
            location[0].properties.fullAddress,
          );
        }
      }}
      options={options}
      placeholder={placeholder}
      highlightOnlyResult={true}
      inputProps={{
        'aria-label': 'input field for location ' + placeholder
      }}
      selectHint={(shouldSelect, e) => {
        // Select the hint if the user hits 'enter'
        return e.keyCode === 13 || shouldSelect;
      }}
      renderMenuItemChildren={location => (
        <div>
          <span>{location.properties.fullAddress}</span>
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
