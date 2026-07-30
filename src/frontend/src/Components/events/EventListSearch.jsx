// React
import React from 'react';

// External imports
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import trackEvent from '../shared/TrackEvent';

export const filterEventsBySearch = (events, searchText) => {
  if (searchText.trim() === '') {
    return events;
  }

  const targetText = searchText.trim().toLowerCase();
  const includesSearch = (value) => {
    if (!value) return false;
    return String(value).replace(/<[^>]*>/g, '').toLowerCase().includes(targetText);
  };

  return events.filter((e) => {
    const location = e.display_category === 'chainUps' ? e.highway_segment_names : e.location_description;
    const description = e.display_category === 'chainUps' ? e.description : e.optimized_description;

    return includesSearch(e.route_at)
      || includesSearch(location)
      || includesSearch(e.closest_landmark)
      || includesSearch(description);
  });
};

export default function EventListSearch(props) {
  const { id, searchText, setSearchText, chainUpsOnly, isMobile = false, open = false } = props;
  const label = chainUpsOnly ? 'chain-ups' : 'delays';

  return (
    <div className={'camSearch-container' + (isMobile ? ' camSearch-container--mobile' : '') + (isMobile && open ? ' open' : '')}>
      <AsyncTypeahead
        id={id}
        isLoading={false}
        onSearch={() => {}}
        onBlur={() => {
          trackEvent(chainUpsOnly ? 'chain-ups' : 'delays', 'event-list', 'search', searchText);
        }}
        onInputChange={(text) => setSearchText(text)}
        placeholder={chainUpsOnly ? 'Search chain-ups' : 'Search delays'}
        inputProps={{
          'aria-label': `input field for ${label} search`,
        }}
        defaultInputValue={searchText}>

        {({ onClear, text }) => (
          <>
            {text &&
              <button
                className={isMobile ? 'close-camera-search-btn' : 'clear-btn'}
                aria-label={`Clear ${label} search`}
                onClick={onClear}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            }
          </>
        )}
      </AsyncTypeahead>
    </div>
  );
}
