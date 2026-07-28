// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/pro-solid-svg-icons';

// Styling
import './FilterOptionsSearch.scss';

export default function FilterOptionsSearch(props) {
  const { value, onChange, placeholder = 'Search filters' } = props;

  return (
    <div className="filter-options-search">
      <input
        type="search"
        className="form-control filter-options-search__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value ?
        <button
          type="button"
          className="filter-options-search__clear"
          aria-label="Clear filter search"
          onClick={() => onChange('')}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
        :
        <span className="filter-options-search__icon" aria-hidden="true">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </span>
      }
    </div>
  );
}
