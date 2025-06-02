// React
import React, { useContext, useState, useEffect } from 'react';

// External imports
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faXmark
 } from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import { CamsContext } from '../../App.js';
import { collator } from '../data/webcams';

// Styling
import './HighwayFilter.scss';

export default function HighwayFilters(props) {
  /* Setup */
  // Props
  const { cameras, handleHwyFiltersClose } = props;

  // Contexts
  const { camsContext, setCamsContext } = useContext(CamsContext);

  // States
  const [orderedHighways, setOrderedHighways] = useState();
  const [searchedHighways, setSearchedHighways] = useState();
  const [searchText, setSearchText] = useState('');

  const getOrderedHighways = (cameras) => {
    const highways = Array.from(new Set(cameras.map(camera => camera.highway_display)));
    const highwayObjs = highways.map(highway => ({
        key: highway,
        display: getHighwayDisplay(highway),
    }));
    return highwayObjs.sort((a, b) => collator.compare(a.key, b.key));
}

  // Effects
  useEffect(() => {
    if (cameras) {
      const orderedHighways = getOrderedHighways(cameras);
      setOrderedHighways(orderedHighways);
    }
  }, [cameras]);

  useEffect(() => {
    // Reset selected highway filter if it's filtered out by new route search
    if (camsContext.highwayFilterKey) {
      const orderedHighways = getOrderedHighways(cameras);
      const selectedHighway = orderedHighways.find(highwayObj => highwayObj.key === camsContext.highwayFilterKey);
      if (!selectedHighway) {
        setCamsContext({...camsContext, highwayFilterKey: null});
      }
    }

    if (searchText === '') {
      setSearchedHighways(orderedHighways);
      return;
    }

    // search for highway name from text input
    const searchFn = (highwayObj, targetText) => {
      const targetLower = targetText.toLowerCase();
      return highwayObj.display.toLowerCase().includes(targetLower);
    };

    const filteredHighways = orderedHighways.filter(highwayObj => searchFn(highwayObj, searchText));

    setSearchedHighways(filteredHighways);
  }, [searchText, orderedHighways]);

  /* Rendering */

  // Sub components
  const getHighwayDisplay = (highway) => {
    return !isNaN(highway.charAt(0)) ? 'Highway ' + highway : highway;
  }

  // Main component
  return camsContext && (
    <div className="highway-filters">
      <div className="search-container">
        <FontAwesomeIcon className="search-icon" icon={faMagnifyingGlass} />

        <AsyncTypeahead
          id="highway-filter-search"
          isLoading={false}
          onSearch={() => {}}
          onInputChange={text => setSearchText(text)}
          placeholder={'Search Highways'}
          inputProps={{
            'aria-label': 'input field for highway filter search',
          }} />
      </div>

      {!camsContext.highwayFilterKey && <div className="selected-filter-container no-selection">No filters selected</div>}

      {camsContext.highwayFilterKey && (
        <div className="selected-filter-container">
          <div className="selected-filter space-between-row">
            <div className="selected-filter-text">
              {getHighwayDisplay(camsContext.highwayFilterKey)}
            </div>

            <div
              className="remove-btn"
              tabIndex={0}
              onClick={() => {
                setCamsContext({...camsContext, highwayFilterKey: null});
                handleHwyFiltersClose();
              }}
              onKeyPress={() => {
                setCamsContext({...camsContext, highwayFilterKey: null});
                handleHwyFiltersClose();
              }}>
              <FontAwesomeIcon icon={faXmark} />
            </div>
          </div>
        </div>
      )}

      {searchedHighways &&
        <div className="highway-options">
          {searchedHighways.map(highwayObj =>
            <div
              key={highwayObj.key}
              className="highway-row"
              tabIndex={0}
              onClick={() => {
                setCamsContext({...camsContext, highwayFilterKey: highwayObj.key});
                handleHwyFiltersClose();
              }}
              onKeyPress={() => {
                setCamsContext({...camsContext, highwayFilterKey: highwayObj.key});
                handleHwyFiltersClose();
              }}>

              <span>{highwayObj.display}</span>
            </div>
          )}
        </div>
      }
    </div>
  );
}
