import React from 'react';
import {useSelector, useDispatch } from 'react-redux'

// Styling
import '../../pages/EventsPage.scss';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import { updateEventFilters } from '../../slices/eventFiltersSlice';

export default function EventFilter() {
  const dispatch = useDispatch();
  const [ eventTypeFilter ] = useSelector((state) => [
    state.eventFilters.filterSet,
  ]);

  const eventTypeFilterHandler = e => {
    const eventType = e.target.value;

    const newFilter = { ...eventTypeFilter };
    newFilter[eventType] = !newFilter[eventType];
    dispatch(updateEventFilters(newFilter));
  };

  const filterProps = [
    {
      id: 'checkbox-filter-incident',
      label: 'Incidents',
      value: 'INCIDENT',
    },
    {
      id: 'checkbox-filter-weather',
      label: 'Road Conditions',
      value: 'WEATHER_CONDITION',
    },
    {
      id: 'checkbox-filter-construction',
      label: 'Current Events',
      value: 'CONSTRUCTION',
    },
    {
      id: 'checkbox-filter-special',
      label: 'Future Events',
      value: 'SPECIAL_EVENT',
    },
  ];
  // Rendering
  return (
    <div className="sort-and-filter">
      <div className="sort"></div>
      <Dropdown align="end">
        <Dropdown.Toggle variant="outline-primary" id="filter-dropdown">
          Filters
          <FontAwesomeIcon icon={faFilter} />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {filterProps.map(fp => (
            <Form.Check
              id={fp.id}
              key={fp.id}
              label={
                <span>
                  {fp.icon}
                  {fp.label}
                </span>
              }
              value={fp.value}
              checked={eventTypeFilter[fp.value]}
              onChange={eventTypeFilterHandler}
            />
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
