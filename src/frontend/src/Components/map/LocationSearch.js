// React
import React, { useState } from 'react';
import { useDispatch } from 'react-redux'

// react-bootstrap-typeahead
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';

// Components and functions
import { getLocations } from '../data/locations.js';

// Styling
import './LocationSearch.scss';

export default function LocationSearch(props) {
  // Redux
  const dispatch = useDispatch();

  const { location, action } = props;

  const [isSearching, setSearching] = useState(false);
  const [options, setLocationOptions] = useState([]);

  const setSelectedLocation = (payload) => {
    dispatch(action(payload));
  }

  const loadLocationOptions = (locationInput) => {
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
  }

  // Rendering
  return (
    <AsyncTypeahead
      clearButton={true}
      defaultSelected={location}
      filterBy={() => true}
      id="location-search-typeahead"
      isLoading={isSearching}
      labelKey="label"
      minLength={3}
      onChange={setSelectedLocation}
      onSearch={loadLocationOptions}
      options={options}
      placeholder="Search for a location..."
      highlightOnlyResult={true}
      selectHint={(shouldSelect, e) => {
        // Select the hint if the user hits 'enter'
        return e.keyCode === 13 || shouldSelect;
      }}
      renderMenuItemChildren={location => (
        <div>
          <span>{location.properties.fullAddress}</span>
        </div>
      )}
    />
  );
}
