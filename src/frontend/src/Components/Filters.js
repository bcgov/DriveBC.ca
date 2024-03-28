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
  faTemperatureHalf,
  faRestroom,
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
  // Misc
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Context
  const { mapContext } = useContext(MapContext);

  // Props
  const { toggleHandler, disableFeatures, enableRoadConditions, textOverride } = props;

  // States
  // Show layer menu by default on main page, desktop only
  const [open, setOpen] = useState(largeScreen && !textOverride);

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
  const tooltipWeather  = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Weather updates for roads.</p>
    </Tooltip>
  );
  const tooltipRestStops = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Travel requires the use of a rest stop.</p>
    </Tooltip>
  );

//  const tooltipReststops = (
//    <Tooltip id="tooltip" className="tooltip-content">
//      <p>Locations of rest stops run by the province.</p>
//    </Tooltip>
//  );

//  const tooltipWeather = (
//    <Tooltip id="tooltip" className="tooltip-content">
//     <p>Learn about weather conditions that could affect your route including:
//       <ul>
//         <li>Current weather for a region from Environment Canada</li>
//         <li>Find out how the road is at the moment at nearby weather stations in this specific location</li>
//       </ul>
//     </p>
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
  const [weather, setWeather] = useState(mapContext.visible_layers.weather);
  const [restStops, setRestStops] = useState(mapContext.visible_layers.restStops);



  return (
    <div className="filters-component">
      <Button
        variant="primary"
        className={'map-btn open-filters' + (open ? ' open' : '')}
        aria-label="open filters options"
        onClick={() => {
          open ? setOpen(false) : setOpen(true) }
        }>
        {textOverride ? textOverride : 'Layer Filters'}

        <FontAwesomeIcon icon={faFilter} />
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
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path className="filter-item__icon__path" d="M19.5625 8.8925L11.1125 0.4425C10.4825 -0.1475 9.5125 -0.1475 8.8825 0.4425L0.4425 8.8925C-0.1475 9.5225 -0.1475 10.4925 0.4425 11.1225L8.8925 19.5725C9.5225 20.1625 10.4925 20.1625 11.1225 19.5725L19.5725 11.1225C20.1625 10.4925 20.1625 9.5225 19.5725 8.8925H19.5625ZM8.9425 10.4525L5.5625 13.8325C5.3125 14.0625 4.9225 14.0625 4.6725 13.8325L1.2925 10.4525C1.0625 10.2025 1.0625 9.8125 1.2925 9.5625L4.6725 6.1825C4.9225 5.9525 5.3125 5.9525 5.5625 6.1825L8.9425 9.5625C9.1725 9.8125 9.1725 10.2025 8.9425 10.4525ZM18.7225 10.4525L15.3425 13.8325C15.0925 14.0625 14.7025 14.0625 14.4525 13.8325L11.0725 10.4525C10.8425 10.2025 10.8425 9.8125 11.0725 9.5625L14.4525 6.1825C14.7025 5.9525 15.0925 5.9525 15.3425 6.1825L18.7225 9.5625C18.9525 9.8125 18.9525 10.2025 18.7225 10.4525Z" fill="#195A97"/>
                      </svg>
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
                    Inland Ferries
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipInlandferries}>
                    <span className="tooltip-info">?</span>
                  </OverlayTrigger>
                </div>
                <div className={'filter-item filter-item--weather' + (weather ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                  <input
                    type="checkbox"
                    name="weather"
                    id="filter--weather"
                    onChange={e => {toggleHandler('weather', e.target.checked); setWeather(!weather)}}
                    defaultChecked={mapContext.visible_layers.weather}
                    disabled={disableFeatures}
                  />
                  <label htmlFor="filter--weather">
                    <span className="filter-item__icon">
                      <FontAwesomeIcon icon={faTemperatureHalf} alt="weather" />
                    </span>
                    Weather
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipWeather}>
                    <span className="tooltip-info">?</span>
                  </OverlayTrigger>
                </div>
                <div className={'filter-item filter-item--rest-stops' + (restStops ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                  <input
                    type="checkbox"
                    name="rest stops"
                    id="filter--rest-stops"
                    onChange={e => {toggleHandler('restStops', e.target.checked); setRestStops(!restStops)}}
                    defaultChecked={mapContext.visible_layers.restStops}
                    disabled={disableFeatures}
                  />
                  <label htmlFor="filter--rest-stops">
                    <span className="filter-item__icon">
                      <FontAwesomeIcon icon={faRestroom} alt="rest stops" />
                    </span>
                    Rest stops
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipRestStops}>
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
                */}

                {/*
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
