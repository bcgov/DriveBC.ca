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
  const { toggleHandler, disableFeatures,enableRoadConditions } = props;

  // States
  const [open, setOpen] = useState(false);

  const tooltipClosures = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Travel is not possible in one or both directions on this road. Find an alternate route or a detour where possible.</p>
    </Tooltip>
  );

  const tooltipMajor = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Expect delays of at least 30 minutes or more on this road. This could be due to a traffic incident, road work, or construction.</p>
    </Tooltip>
  );

  const tooltipMinor = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Expect delays up to 30 minutes on this road. This could be due to a traffic incident, road work, or construction.</p>
    </Tooltip>
  );

  const tooltipFutureevents = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Future road work or construction is planned for this road.</p>
    </Tooltip>
  );

  const tooltipHighwaycameras = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Look at recent pictures from cameras near the highway.</p>
    </Tooltip>
  );

  const tooltipRoadconditions = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>States of the road that may impact drivability.</p>
    </Tooltip>
  );

  const tooltipInlandferries = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Travel requires the use of an inland ferry.</p>
    </Tooltip>
  );

//  const tooltipReststops = (
//    <Tooltip id="tooltip" className="tooltip-content">
//      <p>Locations of provincial rest stops run by the province.</p>
//    </Tooltip>
//  );

//  const tooltipWeather = (
//    <Tooltip id="tooltip" className="tooltip-content">
//      <p>Current weather and predictions for a region from Environment Canada.
//         Winter forecasts for high mountain passes, also from Environment Canada.
//         Find out how the road is at the moment and what nearby weather stations predict for it in this specific location.</p>
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
        variant="primary"
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
        <h4 className="filters-title">Filters</h4>
        <button
          className="close-filters"
          aria-label="close filters options"
          onClick={() => setOpen(false)
        }>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="filters-list">
          <div className="filter-group">
            <p className="filter-group__title">Delays</p>
            <div className="filter-items-group">
              <div className="filter-items filter-items--delays">
                <div className={'filter-item filter-item--closures' + (closures ? ' checked' : '')}>
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
                  <label htmlFor="filter--closures">
                    <span className="filter-item__icon">
                      <FontAwesomeIcon icon={faMinusCircle} alt="closures" />
                    </span>
                    Closures
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipClosures}>
                    <span className="tooltip-info">?</span>
                  </OverlayTrigger>
                </div>

                <div className={'filter-item filter-item--major' + (majorEvents ? ' checked' : '')}>
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
                  <label htmlFor="filter--major">
                    <span className="filter-item__icon">
                    <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path className="filter-item__icon__path" d="M1.22269 6.84836L6.45493 1.61612C7.89977 0.171277 10.2423 0.171276 11.6872 1.61612L16.9194 6.84836C18.3642 8.2932 18.3642 10.6358 16.9194 12.0806L11.6872 17.3128C10.2423 18.7577 7.89977 18.7577 6.45493 17.3128L1.22269 12.0806C-0.222156 10.6358 -0.222157 8.2932 1.22269 6.84836ZM3.18478 8.81045C2.82357 9.17166 2.82357 9.7573 3.18478 10.1185L8.41702 15.3507C8.77823 15.712 9.36386 15.712 9.72507 15.3507L14.9573 10.1185C15.3185 9.7573 15.3185 9.17166 14.9573 8.81045L9.72507 3.57821C9.36386 3.217 8.77823 3.217 8.41702 3.57821L3.18478 8.81045Z"/>
                    </svg>
                    </span>
                    Major
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipMajor}>
                    <span className="tooltip-info">?</span>
                  </OverlayTrigger>
                </div>

                <div className={'filter-item filter-item--minor' + (minorEvents ? ' checked' : '')}>
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
                  <label htmlFor="filter--minor">
                    <span className="filter-item__icon">
                    <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path className="filter-item__icon__path" d="M15.501 0H2.50098C0.660978 0 -0.549022 1.65 0.250978 3.08L6.75098 14.77C7.66098 16.4 10.351 16.4 11.261 14.77L17.761 3.08C18.551 1.65 17.341 0 15.501 0ZM15.441 3.03L9.45098 13.81C9.45098 13.81 9.29098 14.01 8.94098 14.01C8.59098 14.01 8.46098 13.85 8.43098 13.81L2.59098 3.26C2.23098 2.61 2.48098 2 3.23098 2H14.961C15.551 2 15.741 2.51 15.451 3.03H15.441Z"/>
                    </svg>
                    </span>
                    Minor
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipMinor}>
                    <span className="tooltip-info">?</span>
                  </OverlayTrigger>
                </div>

                <div className={'filter-item filter-item--future-events' + (futureEvents ? ' checked' : '')}>
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
                  <label htmlFor="filter--future-events">
                    <span className="filter-item__icon">
                      <FontAwesomeIcon icon={faCalendarDays} alt="future events" />
                    </span>
                    Future events
                  </label>
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
                  <input
                    type="checkbox"
                    name="highway cameras"
                    id="filter--highway-cameras"
                    onChange={e => {toggleHandler('highwayCams', e.target.checked); setHighwayCams(!highwayCams)}}
                    defaultChecked={mapContext.visible_layers.highwayCams}
                    disabled={disableFeatures}
                  />
                  <label htmlFor="filter--highway-cameras">
                    <span className="filter-item__icon">
                      <FontAwesomeIcon icon={faVideo} alt="highway cameras" />
                    </span>
                    Highway cameras
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipHighwaycameras}>
                    <span className="tooltip-info">?</span>
                  </OverlayTrigger>
                </div>

                <div className={'filter-item filter-item--road-conditions' + (roadConditions ? ' checked' : '') + ((disableFeatures && !enableRoadConditions) ? ' disabled' : '')}>
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
                    disabled={(disableFeatures && !enableRoadConditions)}
                  />
                  <label htmlFor="filter--road-conditions">
                    <span className="filter-item__icon">
                      <FontAwesomeIcon icon={faSnowflake} alt="road conditions" />
                    </span>
                    Road conditions
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipRoadconditions}>
                    <span className="tooltip-info">?</span>
                  </OverlayTrigger>
                </div>

                <div className={'filter-item filter-item--inland-ferries' + (inlandFerries ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                  <input
                    type="checkbox"
                    name="inland ferries"
                    id="filter--inland-ferries"
                    onChange={e => {toggleHandler('inlandFerries', e.target.checked); setInlandFerries(!inlandFerries)}}
                    defaultChecked={mapContext.visible_layers.inlandFerries}
                    disabled={disableFeatures}
                  />
                  <label htmlFor="filter--inland-ferries">
                    <span className="filter-item__icon">
                      <FontAwesomeIcon icon={faFerry} alt="inland ferries" />
                    </span>
                    Inland ferries
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipInlandferries}>
                    <span className="tooltip-info">?</span>
                  </OverlayTrigger>
                </div>

                {/*
                <div className={'filter-item filter-item--rest-stops'}>
                  <span className="filter-item__icon">
                    <FontAwesomeIcon icon={faRestroom} alt="provincial rest stops" />
                  </span>
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
                  <span className="filter-item__icon">
                    <FontAwesomeIcon icon={faCloudSun} alt="weather" />
                  </span>
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
      </div>
      }
    </div>
  );
}
