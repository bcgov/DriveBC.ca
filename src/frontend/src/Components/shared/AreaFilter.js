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
  const { handleAreaFiltersClose, objects, showAllByDefault } = props;

  // Contexts
  const { filterContext, setFilterContext } = useContext(FilterContext);

  // Redux
  const { areas, selectedRoute } = useSelector(useCallback(memoize(state => ({
    areas: state.feeds.areas.list,
    selectedRoute: state.routes.selectedRoute
  }))));

  // States
  const [displayedAreas, setDisplayedAreas] = useState();
  const [searchedAreas, setSearchedAreas] = useState();
  const [searchText, setSearchText] = useState('');

  // Effects
  useEffect(() => {
    if (!displayedAreas || displayedAreas.length === 0) {
      setSearchedAreas([]);
      return;
    }

    if (searchText === '') {
      setSearchedAreas(displayedAreas);
      return;
    }

    // search for area name from text input
    const searchFn = (areaObj, targetText) => {
      const targetLower = targetText.toLowerCase();
      return areaObj.name.toLowerCase().includes(targetLower);
    };

    const filteredAreas = areas.filter(areaObj => searchFn(areaObj, searchText));
    setSearchedAreas(filteredAreas);

  }, [searchText, displayedAreas]);

  useEffect(() => {
    if (!areas || !objects) {
      return;
    }

    // DBC22-4686: delay list should show all areas when no route is selected
    if (showAllByDefault && !selectedRoute) {
      setDisplayedAreas(areas);
      return;
    }

    // Show only areas that have an object
    const uniqueAreaIds = Array.from(new Set(objects.flatMap(obj =>
      // Handle both single and multiple areas (events)
      Array.isArray(obj.area) ? obj.area : [obj.area]
    )));

    const currentAreas = areas.filter(area => uniqueAreaIds.includes(area.id));
    setDisplayedAreas(currentAreas);

  }, [areas, objects]);

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
              onKeyDown={() => {
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
              onKeyDown={() => {
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
