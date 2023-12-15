// React
import React, { useState, useContext } from 'react';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faXmark,
  faExclamationCircle,
  faExclamationTriangle,
  faCalendarDays,
  faVideo,
  faSnowflake,
  faFerry,
  faRestroom,
  faCloudSun } from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

// Components and functions
import { MapContext } from '../App.js';

// Styling
import './Layers.scss';

export default function Layers({ open, setLayersOpen, toggleLayer }) {
  const { mapContext } = useContext(MapContext);
  const tooltip = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>This is a tooltip.</p>
    </Tooltip>
  );

  // States for events
  const [filterChecked, setFilterChecked] = useState(false);
  const toggleChecked = () => {
    setFilterChecked(!filterChecked);
  };

  // States for cameras
  const [filterCheckedCams, setFilterCheckedCams] = useState(false);
  const toggleCheckedCams = () => {
    setFilterCheckedCams(!filterCheckedCams);
  };

  // States for ferries
  const [filterCheckedFerries, setFilterCheckedFerries] = useState(false);
  const toggleCheckedFerries = () => {
    setFilterCheckedFerries(!filterCheckedFerries);
  };

  if (!open) {
    return (
      <Button
        variant="primary"
        className="map-btn open-layers"
        onClick={() => setLayersOpen(true)}
        aria-label="open layers options">
        <FontAwesomeIcon icon={faFilter} />
        Filters
      </Button>
    );
  }

  return (
    <div className="layers">
      <h4 className="filters-title">Filters</h4>
      <button className="close-layers" onClick={() => setLayersOpen(false)} aria-label="close layers options">
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <div className="filter-group">
        <p className="filter-group__title">Delays</p>
        <div className="filter-items-group">
          <div className="filter-items filter-items--delays">
            <div className={'filter-item filter-item--major'}>
              <div className="filter-item__icon">
                <FontAwesomeIcon icon={faExclamationTriangle} alt="major delays" />
              </div>
              <input
                type="checkbox"
                name="major"
                id="filter--major"
              />
              <label htmlFor="filter--major">Major</label>
              <OverlayTrigger placement="top" overlay={tooltip}>
                <span className="tooltip-info">?</span>
              </OverlayTrigger>
            </div>

            <div className={'filter-item filter-item--minor'}>
              <div className="filter-item__icon">
                <FontAwesomeIcon icon={faExclamationCircle} alt="minor delays" />
              </div>
              <input
                type="checkbox"
                name="minor"
                id="filter--minor"
              />
              <label htmlFor="filter--minor">Minor</label>
              <OverlayTrigger placement="top" overlay={tooltip}>
                <span className="tooltip-info">?</span>
              </OverlayTrigger>
            </div>

            <div className={'filter-item filter-item--future-events' + (filterChecked ? ' checked' : '')}>
              <div className="filter-item__icon">
                <FontAwesomeIcon icon={faCalendarDays} alt="future events" />
              </div>
              <input
                type="checkbox"
                name="future events"
                id="filter--future-events"
                onChange={e => {toggleLayer('eventsLayer', e.target.checked); toggleChecked()}}
              />
              <label htmlFor="filter--future-events">Future Events</label>
              <OverlayTrigger placement="top" overlay={tooltip}>
                <span className="tooltip-info">?</span>
              </OverlayTrigger>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-group">
        <p className="filter-group__title">Conditions and features</p>
        <div className="filter-items-group">
          <div className="filter-items filter-items--conditions">
            <div className={'filter-item filter-item--highway-cameras' + (filterCheckedCams ? ' checked' : '')}>
              <div className="filter-item__icon">
                <FontAwesomeIcon icon={faVideo} alt="highway cameras" />
              </div>
              <input
                type="checkbox"
                name="highway cameras"
                id="filter--highway-cameras"
                onChange={e => {toggleLayer('webcamsLayer', e.target.checked); toggleCheckedCams()}}
                defaultChecked={mapContext.visible_layers.webcamsLayer}
              />
              <label htmlFor="filter--highway-cameras">Highway cameras</label>
              <OverlayTrigger placement="top" overlay={tooltip}>
                <span className="tooltip-info">?</span>
              </OverlayTrigger>
            </div>

            <div className={'filter-item filter-item--road-conditions'}>
              <div className="filter-item__icon">
                <FontAwesomeIcon icon={faSnowflake} alt="road conditions" />
              </div>
              <input
                type="checkbox"
                name="road conditions"
                id="filter--road-conditions"
              />
              <label htmlFor="filter--road-conditions">Road conditions</label>
              <OverlayTrigger placement="top" overlay={tooltip}>
                <span className="tooltip-info">?</span>
              </OverlayTrigger>
            </div>

            <div className={'filter-item filter-item--inland-ferries' + (filterCheckedFerries ? ' checked' : '')}>
              <div className="filter-item__icon">
                <FontAwesomeIcon icon={faFerry} alt="inland ferries" />
              </div>
              <input
                type="checkbox"
                name="inland ferries"
                id="filter--inland-ferries"
                onChange={e => {toggleLayer('ferriesLayer', e.target.checked); toggleCheckedFerries()}}
              />
              <label htmlFor="filter--inland-ferries">Inland ferries</label>
              <OverlayTrigger placement="top" overlay={tooltip}>
                <span className="tooltip-info">?</span>
              </OverlayTrigger>
            </div>

            <div className={'filter-item filter-item--rest-stops'}>
              <div className="filter-item__icon">
                <FontAwesomeIcon icon={faRestroom} alt="provincial rest stops" />
              </div>
              <input
                type="checkbox"
                name="provincial rest stops"
                id="filter--rest-stops"
              />
              <label htmlFor="filter--rest-stops">Provincial rest stops</label>
              <OverlayTrigger placement="top" overlay={tooltip}>
                <span className="tooltip-info">?</span>
              </OverlayTrigger>
            </div>

            <div className={'filter-item filter-item--weather'}>
              <div className="filter-item__icon">
                <FontAwesomeIcon icon={faCloudSun} alt="weather" />
              </div>
              <input
                type="checkbox"
                name="weather"
                id="filter--weather"
              />
              <label htmlFor="filter--weather">Weather</label>
              <OverlayTrigger placement="top" overlay={tooltip}>
                <span className="tooltip-info">?</span>
              </OverlayTrigger>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
