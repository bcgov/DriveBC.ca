// React
import React, { useCallback, useRef, useState, useEffect } from 'react';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';

// External imports
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons';
import { faFilter as faFilterOutline } from '@fortawesome/pro-regular-svg-icons';
import { updateHighwayFilter } from '../../slices/highwayFilterSlice';
import { useMediaQuery } from '@uidotdev/usehooks';

// Internal imports
import { collator } from '../data/webcams';

// Styling
import './HighwayFilter.scss';

export default function HighwayFilters(props) {
  /* Setup */
  const { getCheckedHighway } = props;

  // Redux
  const dispatch = useDispatch();
  const { highwayFilter } = useSelector(
    useCallback(
      memoize(state => ({
        highwayFilter: state.highwayFilter.highways,
      })),
    ),
  );

  // States
  const [open, setOpen] = useState(false);
  const [orderedHighways, setOrderedHighways] = useState();
  const [searchedHighways, setSearchedHighways] = useState();
  const [selectedHighway, setSelectedHighway] = useState();
  const [searchText, setSearchText] = useState('');

  // Refs
  const initialMount = useRef(true);

  // Effects
  useEffect(() => {
    // run the collator compare on object.keys, sort the list then set state for orderedHighways
    const highwayList = searchedHighways ? searchedHighways : Object.keys(highwayFilter);

    const orderedList = highwayList.sort(function (a, b) {
      return collator.compare(a, b);
    });

    setOrderedHighways(orderedList);
  }, [highwayFilter, searchedHighways]);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    // reset the searched highways when the search text is empty
    if (!searchText) {
      setSearchedHighways(null);
      return;
    }

    // search for highway name from text input
    const searchFn = (highway, targetText) => {
      const targetLower = targetText.toLowerCase();
      return highway['highwayName'].toLowerCase().includes(targetLower);
    };

    const searchableList = Object.values({ ...highwayFilter });
    const filteredHighways = !searchText ? null : searchableList.filter(highway => searchFn(highway, searchText));

    if (filteredHighways) {
      setSearchedHighways(filteredHighways.map(highway => highway.id));
    }
  }, [searchText]);

  // Reset search text when the filter is closed
  useEffect(() => {
    if (!open) {
      setSearchText('');
    }
  }, [open]);

  // Handlers
  const filterHandler = highwayKey => {
    const highways = { ...highwayFilter };
    highways[highwayKey].checked = !highways[highwayKey].checked;
    if (selectedHighway) {
      highways[selectedHighway].checked = false;
    }

    dispatch(updateHighwayFilter(highways));
    setSelectedHighway(highways[highwayKey].checked ? highwayKey : null);
  };

  const handleRemoveFilter = () => {
    const highways = { ...highwayFilter };
    highways[selectedHighway].checked = false;

    dispatch(updateHighwayFilter(highways));
    setSelectedHighway(null);
  };

  /* Rendering */
  // Constants
  const largeScreen = useMediaQuery('only screen and (min-width : 1200px)');

  // Main component
  return (
    <div className="filters-component">
      <button
        className={'highway-filter-btn' + (open ? ' open' : '')}
        aria-label="open filters options"
        onClick={() => {open ? setOpen(false) : setOpen(true)}}>

        {largeScreen && <div className="caption">Filter by Highway</div>}

        <FontAwesomeIcon icon={selectedHighway ? faFilter : faFilterOutline} />

        {selectedHighway &&
          <div className="active-count">1</div>
        }
      </button>

      {open && (
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

          {!selectedHighway && <div className="selected-filter-container no-selection">No Filters selected</div>}

          {selectedHighway && (
            <div className="selected-filter-container space-between-row">
              <div className="selected-filter">
                {getCheckedHighway() && highwayFilter[getCheckedHighway()].highwayName}
              </div>

              <div className="remove-btn" onClick={() => handleRemoveFilter()}>
                Remove Filter
              </div>
            </div>
          )}

          {orderedHighways &&
            <div className="highway-options">
              {orderedHighways.map(highway =>
                <div key={highway} className="highway-row" onClick={() => filterHandler(highway)}>
                  <span>{highwayFilter[highway].highwayName}</span>
                </div>
              )}
            </div>
          }
        </div>
      )}
    </div>
  );
}
