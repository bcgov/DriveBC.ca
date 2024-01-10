// React
import React, { useState, useContext } from 'react';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faXmark,
  faMinusCircle,
  faCalendarDays,
  faVideo,
  faSnowflake,
  faFerry,
//  faRestroom,
//  faCloudSun
} from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import {useMediaQuery} from '@uidotdev/usehooks';


// Components and functions
import { MapContext } from '../App.js';

// Styling
import './Filters.scss';

export default function Filters(props) {
  // Context
  const { mapContext } = useContext(MapContext);

  // Props
  const { toggleHandler, disableFeatures } = props;

  // States
  const [open, setOpen] = useState(false);

  const tooltipClosures = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Indicates a complete closure of the road at this point or segment.</p>
    </Tooltip>
  );

  const tooltipMajor = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Indicates a significant delay of more than 20 minutes to travel in at least one direction on this road. A Major Delay may be a traffic incident or a road event (such as road work, construction, or restoration).</p>
    </Tooltip>
  );

  const tooltipMinor = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Indicates a minor delay of less than 20 minutes to travel in at least one direction on this route. A Minor Delay may be a traffic incident or a road event (such as road work, construction, or restoration).</p>
    </Tooltip>
  );

  const tooltipFutureevents = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Shows a planned future road events that may impact travel on routes throughout the province. An Event is typically a road work, constructions, or restoration project.</p>
    </Tooltip>
  );

  const tooltipHighwaycameras = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Shows the location of highway cameras throughout the province. The map icon shows the direction that the camera is facing.</p>
    </Tooltip>
  );

  const tooltipRoadconditions = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Indicates negative road condition that may impact the drivability of a particular stretch of road.</p>
    </Tooltip>
  );

  const tooltipInlandferries = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Shows the location of inland ferries within the interior of BC. This does not include coastal BC Ferries.</p>
    </Tooltip>
  );

//  const tooltipReststops = (
//    <Tooltip id="tooltip" className="tooltip-content">
//      <p>Shows the location of Provincial Rest Stops on highways throughout the province.</p>
//    </Tooltip>
//  );

//  const tooltipWeather = (
//    <Tooltip id="tooltip" className="tooltip-content">
//      <p>Regional current and forecasted weather from Environment Canada for this area.</p>
//    </Tooltip>
//  );

  // States for toggles
  const [closures, setClosures] = useState(mapContext.visible_layers.closures);
  const [majorEvents, setMajorEvents] = useState(mapContext.visible_layers.majorEvents);
  const [minorEvents, setMinorEvents] = useState(mapContext.visible_layers.minorEvents);
  const [futureEvents, setFutureEvents] = useState(mapContext.visible_layers.futureEvents);
  const [roadConditions, setRoadConditions] = useState(mapContext.visible_layers.roadConditions);
  const [highwayCams, setHighwayCams] = useState(mapContext.visible_layers.highwayCams);
  const [inlandFerries, setInlandFerries] = useState(mapContext.visible_layers.inlandFerries);

  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  return (
    <div className="filters-component">
      <Button
        variant="outline"
        className={'map-btn open-filters' + (open ? ' open' : '')}
        aria-label="open filters options"
        onClick={() => {
          open ? setOpen(false) : setOpen(true) }
        }>
        <FontAwesomeIcon icon={faFilter} />
        Filters
      </Button>

      { open &&
      <div className="filters">
        { !largeScreen &&
          <div>
            <h4 className="filters-title">Filters</h4>
            <button
              className="close-filters"
              aria-label="close filters options"
              onClick={() => setOpen(false)
            }>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        }

        <div className="filter-group">
          <p className="filter-group__title">Delays</p>
          <div className="filter-items-group">
            <div className="filter-items filter-items--delays">
              <div className={'filter-item filter-item--closures' + (closures ? ' checked' : '')}>
                <div className="filter-item__icon">
                  <FontAwesomeIcon icon={faMinusCircle} alt="closures" />
                </div>
                <input
                  type="checkbox"
                  name="closures"
                  id="filter--closures"
                  onChange={e => {
                    toggleHandler('closures', e.target.checked);
                    toggleHandler('closuresLines', e.target.checked, true);
                    setClosures(!closures)
                  }}
                  defaultChecked={mapContext.visible_layers.closures}
                />
                <label htmlFor="filter--closures">Closures</label>
                <OverlayTrigger placement="top" overlay={tooltipClosures}>
                  <span className="tooltip-info">?</span>
                </OverlayTrigger>
              </div>

              <div className={'filter-item filter-item--major' + (majorEvents ? ' checked' : '')}>
                <div className="filter-item__icon">
                  <svg alt="major delays" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="customIcon-bg" d="M7.87872 1.12135C9.05029 -0.0502183 10.9498 -0.0502166 12.1214 1.12136L18.8787 7.87868C20.0503 9.05026 20.0503 10.9498 18.8787 12.1213L12.1213 18.8787C10.9497 20.0503 9.05026 20.0503 7.87868 18.8787L1.12136 12.1214C-0.0502174 10.9498 -0.0502174 9.05029 1.12136 7.87872L7.87872 1.12135Z" fill="#1A5A96"/>
                    <path className="customIcon-fg" d="M10.8176 5.71429V11.4286C10.8176 11.8304 10.4403 12.1429 10.0126 12.1429C9.55976 12.1429 9.20755 11.8304 9.20755 11.4286V5.71429C9.20755 5.33483 9.55976 5.00001 10.0126 5.00001C10.4403 5.00001 10.8176 5.33483 10.8176 5.71429ZM10.0126 15C9.63523 15 9.30818 14.8438 9.13208 14.5536C8.95598 14.2857 8.95598 13.9509 9.13208 13.6607C9.30818 13.3929 9.63523 13.2143 10.0126 13.2143C10.3648 13.2143 10.6918 13.3929 10.8679 13.6607C11.044 13.9509 11.044 14.2857 10.8679 14.5536C10.6918 14.8438 10.3648 15 10.0126 15Z" fill="white"/>
                  </svg>
                </div>
                <input
                  type="checkbox"
                  name="major"
                  id="filter--major"
                  onChange={e => {
                    toggleHandler('majorEvents', e.target.checked);
                    toggleHandler('majorEventsLines', e.target.checked, true);
                    setMajorEvents(!majorEvents)
                  }}
                  defaultChecked={mapContext.visible_layers.majorEvents}
                />
                <label htmlFor="filter--major">Major</label>
                <OverlayTrigger placement="top" overlay={tooltipMajor}>
                  <span className="tooltip-info">?</span>
                </OverlayTrigger>
              </div>

              <div className={'filter-item filter-item--minor' + (minorEvents ? ' checked' : '')}>
                <div className="filter-item__icon">
                  <svg alt="minor delays" width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="customIcon-bg" d="M11.2552 15.2763C10.3487 16.9079 7.65127 16.9079 6.74483 15.2763L0.247828 3.5816C-0.54594 2.1528 0.663609 0.5 2.50299 0.5L15.497 0.500001C17.3364 0.500001 18.5459 2.1528 17.7522 3.5816L11.2552 15.2763Z" fill="#1A5A96"/>
                    <path className="customIcon-fg" d="M9.81761 3.21429V8.92857C9.81761 9.33036 9.44025 9.64286 9.01258 9.64286C8.55975 9.64286 8.20755 9.33036 8.20755 8.92857V3.21429C8.20755 2.83482 8.55975 2.5 9.01258 2.5C9.44025 2.5 9.81761 2.83482 9.81761 3.21429ZM9.01258 12.5C8.63522 12.5 8.30818 12.3438 8.13208 12.0536C7.95598 11.7857 7.95598 11.4509 8.13208 11.1607C8.30818 10.8929 8.63522 10.7143 9.01258 10.7143C9.36478 10.7143 9.69183 10.8929 9.86793 11.1607C10.044 11.4509 10.044 11.7857 9.86793 12.0536C9.69183 12.3438 9.36478 12.5 9.01258 12.5Z" fill="white"/>
                  </svg>
                </div>
                <input
                  type="checkbox"
                  name="minor"
                  id="filter--minor"
                  onChange={e => {
                    toggleHandler('minorEvents', e.target.checked);
                    toggleHandler('minorEventsLines', e.target.checked, true);
                    setMinorEvents(!minorEvents);
                  }}
                  defaultChecked={mapContext.visible_layers.minorEvents}
                />
                <label htmlFor="filter--minor">Minor</label>
                <OverlayTrigger placement="top" overlay={tooltipMinor}>
                  <span className="tooltip-info">?</span>
                </OverlayTrigger>
              </div>

              <div className={'filter-item filter-item--future-events' + (futureEvents ? ' checked' : '')}>
                <div className="filter-item__icon">
                  <FontAwesomeIcon icon={faCalendarDays} alt="future events" />
                </div>
                <input
                  type="checkbox"
                  name="future events"
                  id="filter--future-events"
                  onChange={e => {
                    toggleHandler('futureEvents', e.target.checked);
                    toggleHandler('futureEventsLines', e.target.checked, true);
                    setFutureEvents(!futureEvents);
                  }}
                  defaultChecked={mapContext.visible_layers.futureEvents}
                />
                <label htmlFor="filter--future-events">Future Events</label>
                <OverlayTrigger placement="top" overlay={tooltipFutureevents}>
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
              <div className={'filter-item filter-item--highway-cameras' + (highwayCams ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                <div className="filter-item__icon">
                  <FontAwesomeIcon icon={faVideo} alt="highway cameras" />
                </div>
                <input
                  type="checkbox"
                  name="highway cameras"
                  id="filter--highway-cameras"
                  onChange={e => {toggleHandler('highwayCams', e.target.checked); setHighwayCams(!highwayCams)}}
                  defaultChecked={mapContext.visible_layers.highwayCams}
                  disabled={disableFeatures}
                />
                <label htmlFor="filter--highway-cameras">Highway cameras</label>
                <OverlayTrigger placement="top" overlay={tooltipHighwaycameras}>
                  <span className="tooltip-info">?</span>
                </OverlayTrigger>
              </div>

              <div className={'filter-item filter-item--road-conditions' + (roadConditions ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                <div className="filter-item__icon">
                  <FontAwesomeIcon icon={faSnowflake} alt="road conditions" />
                </div>
                <input
                  type="checkbox"
                  name="road conditions"
                  id="filter--road-conditions"
                  onChange={e => {
                    toggleHandler('roadConditions', e.target.checked);
                    toggleHandler('roadConditionsLines', e.target.checked);
                    setRoadConditions(!roadConditions);
                  }}
                  defaultChecked={mapContext.visible_layers.roadConditions}
                  disabled={disableFeatures}
                />
                <label htmlFor="filter--road-conditions">Road conditions</label>
                <OverlayTrigger placement="top" overlay={tooltipRoadconditions}>
                  <span className="tooltip-info">?</span>
                </OverlayTrigger>
              </div>

              <div className={'filter-item filter-item--inland-ferries' + (inlandFerries ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                <div className="filter-item__icon">
                  <FontAwesomeIcon icon={faFerry} alt="inland ferries" />
                </div>
                <input
                  type="checkbox"
                  name="inland ferries"
                  id="filter--inland-ferries"
                  onChange={e => {toggleHandler('inlandFerries', e.target.checked); setInlandFerries(!inlandFerries)}}
                  defaultChecked={mapContext.visible_layers.inlandFerries}
                  disabled={disableFeatures}
                />
                <label htmlFor="filter--inland-ferries">Inland ferries</label>
                <OverlayTrigger placement="top" overlay={tooltipInlandferries}>
                  <span className="tooltip-info">?</span>
                </OverlayTrigger>
              </div>

              {/*
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
                <OverlayTrigger placement="top" overlay={tooltipReststops}>
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
                <OverlayTrigger placement="top" overlay={tooltipWeather}>
                  <span className="tooltip-info">?</span>
                </OverlayTrigger>
              </div>
              */}
            </div>
          </div>
        </div>
      </div>
      }
    </div>
  );
}
