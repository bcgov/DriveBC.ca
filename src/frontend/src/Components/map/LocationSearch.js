// React
import React, { useState } from 'react';

// react-bootstrap-typeahead
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';

// Components and functions
import { getLocations } from '../data/locations.js';

// Styling
import './LocationSearch.scss';

export default function LocationSearch(props) {
  const { setSelectedLocation } = props;

  const [isSearching, setSearching] = useState(false);
  const [options, setLocationOptions] = useState([]);

  function loadLocationOptions(locationInput) {
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
      filterBy={() => true}
      id="location-search-typeahead"
      isLoading={isSearching}
      labelKey="label"
      minLength={3}
      onChange={setSelectedLocation}
      onSearch={loadLocationOptions}
      options={options}
      placeholder="Search for a location..."
      renderMenuItemChildren={location => (
        <div>
          <span>{location.properties.fullAddress}</span>
        </div>
      )}
    />
  );
}
