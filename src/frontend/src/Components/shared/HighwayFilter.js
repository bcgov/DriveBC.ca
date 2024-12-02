// React
import React, { useContext, useState, useEffect } from 'react';

// External imports
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons';
import { faFilter as faFilterOutline } from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';

// Internal imports
import { CamsContext } from '../../App.js';
import { collator } from '../data/webcams';

// Styling
import './HighwayFilter.scss';

export default function HighwayFilters(props) {
  /* Setup */
  // Props
  const { cameras } = props;

  // Contexts
  const { camsContext, setCamsContext } = useContext(CamsContext);

  // States
  const [showFilter, setShowFilter] = useState(false);
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

  // Reset search text when the filter is closed
  useEffect(() => {
    if (!showFilter) {
      setSearchText('');
    }
  }, [showFilter]);

  /* Rendering */
  // Constants
  const largeScreen = useMediaQuery('only screen and (min-width : 1200px)');

  // Sub components
  const getHighwayDisplay = (highway) => {
    return !isNaN(highway.charAt(0)) ? 'Highway ' + highway : highway;
  }

  // Main component
  return camsContext && (
    <div className="highway-filters">
      <button
        className={'highway-filter-btn' + (showFilter ? ' showFilter' : '')}
        aria-label="showFilter filters options"
        onClick={() => setShowFilter(!showFilter)}>

        {largeScreen && <p className="btn-text">Filter by Highway</p>}

        <FontAwesomeIcon icon={camsContext.highwayFilterKey ? faFilter : faFilterOutline} />

        {camsContext.highwayFilterKey &&
          <div className="active-count">1</div>
        }
      </button>

      {showFilter && (
        <div className="highway-filters-popup">
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
            <div className="selected-filter-container space-between-row">
              <div className="selected-filter">
                {getHighwayDisplay(camsContext.highwayFilterKey)}
              </div>

              <div
                className="remove-btn"
                tabIndex={0}
                onClick={() => setCamsContext({...camsContext, highwayFilterKey: null})}
                onKeyPress={() => setCamsContext({...camsContext, highwayFilterKey: null})}>

                Remove Filter
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
                  onClick={() => setCamsContext({...camsContext, highwayFilterKey: highwayObj.key})}
                  onKeyPress={() => setCamsContext({...camsContext, highwayFilterKey: highwayObj.key})}>

                  <span>{highwayObj.display}</span>
                </div>
              )}
            </div>
          }
        </div>
      )}
    </div>
  );
}
