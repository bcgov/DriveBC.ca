// React
import React, { useContext, useState, useEffect, useCallback } from 'react';

// Redux
import { useSelector } from "react-redux";
import { memoize } from "proxy-memoize";

// External imports
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faXmark
 } from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import { FilterContext } from '../../App.js';

// Styling
import './AreaFilter.scss';

export default function AreaFilter(props) {
  /* Setup */
  // Props
  const { handleAreaFiltersClose } = props;

  // Contexts
  const { filterContext, setFilterContext } = useContext(FilterContext);

  // Redux
  const { areas } = useSelector(useCallback(memoize(state => ({
    areas: state.feeds.areas.list,
  }))));

  // States
  const [searchedAreas, setSearchedAreas] = useState();
  const [searchText, setSearchText] = useState('');

  // Effects
  useEffect(() => {
    if (searchText === '') {
      setSearchedAreas(areas);
      return;
    }

    // search for area name from text input
    const searchFn = (areaObj, targetText) => {
      const targetLower = targetText.toLowerCase();
      return areaObj.name.toLowerCase().includes(targetLower);
    };

    const filteredAreas = areas.filter(areaObj => searchFn(areaObj, searchText));
    setSearchedAreas(filteredAreas);
  }, [searchText, areas]);

  /* Rendering */
  // Main component
  return filterContext && (
    <div className="area-filters">
      <div className="search-container">
        <FontAwesomeIcon className="search-icon" icon={faMagnifyingGlass} />

        <AsyncTypeahead
          id="area-filter-search"
          isLoading={false}
          onSearch={() => {}}
          onInputChange={text => setSearchText(text)}
          placeholder={'Search Areas'}
          inputProps={{
            'aria-label': 'input field for Area filter search',
          }} />
      </div>

      {!filterContext.areaFilter && <div className="selected-filter-container no-selection">No filters selected</div>}

      {filterContext.areaFilter && (
        <div className="selected-filter-container">
          <div className="selected-filter space-between-row">
            <div className="selected-filter-text">
              {filterContext.areaFilter &&
                filterContext.areaFilter.name
              }
            </div>

            <div
              className="remove-btn"
              tabIndex={0}
              onClick={() => {
                setFilterContext({...filterContext, areaFilter: null});
                handleAreaFiltersClose();
              }}
              onKeyPress={() => {
                setFilterContext({...filterContext, areaFilter: null});
                handleAreaFiltersClose();
              }}>
              <FontAwesomeIcon icon={faXmark} />
            </div>
          </div>
        </div>
      )}

      {searchedAreas &&
        <div className="area-options">
          {searchedAreas.map(areaObj =>
            <div
              key={areaObj.id}
              className="area-row"
              tabIndex={0}
              onClick={() => {
                setFilterContext({...filterContext, areaFilter: areaObj});
                handleAreaFiltersClose();
              }}
              onKeyPress={() => {
                setFilterContext({...filterContext, areaFilter: areaObj});
                handleAreaFiltersClose();
              }}>

              <span>{areaObj.name}</span>
            </div>
          )}
        </div>
      }
    </div>
  );
}
