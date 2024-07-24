// React
import React, { useCallback, useState, useEffect } from 'react';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark } from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { updateHighwayFilter } from '../../slices/highwayFilterSlice';
// Redux
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { collator } from '../data/webcams';

// Styling
import './HighwayFilter.scss';

export default function HighwayFilters(props) {
  const { getCheckedHighway } = props;
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

  useEffect(() => {
    // run the collator compare on object.keys, sort the list then set state for orderedHighways
    const highwayList = searchedHighways
      ? searchedHighways
      : Object.keys(highwayFilter);
    const orderedList = highwayList.sort(function (a, b) {
      return collator.compare(a, b);
    });
    setOrderedHighways(orderedList);
  }, [highwayFilter, searchedHighways]);

  useEffect(() => {
    // search for highway name from text input
    const searchFn = (highway, targetText) => {
      const targetLower = targetText.toLowerCase();
      if (highway['highwayName'].toLowerCase().includes(targetLower)) {
        return true;
      }
      return false;
    };
    const searchableList = Object.values({ ...highwayFilter });
    const filteredHighways = !searchText
      ? null
      : searchableList.filter(highway => searchFn(highway, searchText));
    if (filteredHighways) {
      setSearchedHighways(filteredHighways.map(highway => highway.id));
    }
  }, [searchText]);

  return (
    <div className="filters-component">
      <Button
        variant="primary"
        className={'map-btn open-filters' + (open ? ' open' : '')}
        aria-label="open filters options"
        onClick={() => {
          open ? setOpen(false) : setOpen(true);
        }}>
        Filter by Highway
        <FontAwesomeIcon icon={faFilter} />
      </Button>
      {open && (
        <div className="filters">
          <h4 className="filters-title">Filters</h4>

          <button
            className="close-filters"
            aria-label="close filters options"
            onClick={() => setOpen(false)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
          {!selectedHighway && <div>no highways selected</div>}
          {selectedHighway && (
            <div>
              <div>
                {getCheckedHighway() &&
                  highwayFilter[getCheckedHighway()].highwayName}
              </div>
              <button onClick={() => handleRemoveFilter()}>
                Remove Filter
              </button>
            </div>
          )}
          <div className="search-container">
            <AsyncTypeahead
              id="highway-filter-search"
              isLoading={false}
              onSearch={() => {}}
              onInputChange={text => setSearchText(text)}
              placeholder={'Find by Highway'}
              inputProps={{
                'aria-label': 'input field for highway filter search',
              }}
            />
          </div>
          {orderedHighways &&
            orderedHighways.map(highway => {
              return (
                <div key={highway} onClick={() => filterHandler(highway)}>
                  <span>{highwayFilter[highway].highwayName}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
