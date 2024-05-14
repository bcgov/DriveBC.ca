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
  faFerry,
  faSunCloud,
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import {useMediaQuery} from '@uidotdev/usehooks';
import trackEvent from './TrackEvent';

// Components and functions
import { MapContext } from '../../App.js';

// Styling
import './Filters.scss';

export default function Filters(props) {
  // Misc
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Context
  const { mapContext, setMapContext } = useContext(MapContext);

  // Props
  const {
    mapLayers,
    callback,
    disableFeatures,
    enableRoadConditions,
    textOverride,
    isCamDetail,
    referenceData
  } = props;

  // Const for enabling layer that the reference event belongs to
  const eventCategory = referenceData ? referenceData.display_category : false;

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

  // States for toggles
  const [closures, setClosures] = useState(eventCategory && eventCategory == 'closures' ? true : mapContext.visible_layers.closures);
  const [majorEvents, setMajorEvents] = useState(eventCategory && eventCategory == 'majorEvents' ? true : mapContext.visible_layers.majorEvents);
  const [minorEvents, setMinorEvents] = useState(eventCategory && eventCategory == 'minorEvents' ? true : mapContext.visible_layers.minorEvents);
  const [futureEvents, setFutureEvents] = useState(eventCategory && eventCategory == 'futureEvents' ? true : mapContext.visible_layers.futureEvents);
  const [roadConditions, setRoadConditions] = useState(mapContext.visible_layers.roadConditions);
  const [highwayCams, setHighwayCams] = useState(isCamDetail ? isCamDetail : mapContext.visible_layers.highwayCams);
  const [inlandFerries, setInlandFerries] = useState(mapContext.visible_layers.inlandFerries);
  const [weather, setWeather] = useState(mapContext.visible_layers.weather);
  const [restStops, setRestStops] = useState(mapContext.visible_layers.restStops);

  // Helpers
  const toggleLayer = (layer, checked, runCallback=true) => {
    // Set visible in map only
    mapLayers?.current[layer].setVisible(checked);

    // Run callback for event list, non-line layers
    if (callback && runCallback) {
      callback(layer, checked);
    }

    // Set context and local storage
    mapContext.visible_layers[layer] = checked;
    setMapContext(mapContext);
    localStorage.setItem('mapContext', JSON.stringify(mapContext));
  }

  return (
    <div className="filters-component">
      <Button
        variant="primary"
        className={'map-btn open-filters' + (open ? ' open' : '')}
        aria-label="open filters options"
        onClick={() => {
          open ? setOpen(false) : setOpen(true) }
        }>
        {textOverride ? textOverride : 'Layer filters'}

        <FontAwesomeIcon icon={faFilter} />
      </Button>

      {open &&
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
                        trackEvent('click', 'map', 'Toggle closures layer')
                        toggleLayer('closures', e.target.checked);
                        toggleLayer('closuresLines', e.target.checked, false);
                        setClosures(!closures)
                      }}
                      defaultChecked={eventCategory && eventCategory == 'closures' ? true : mapContext.visible_layers.closures}
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
                        trackEvent('click', 'map', 'Toggle major events layer');
                        toggleLayer('majorEvents', e.target.checked);
                        toggleLayer('majorEventsLines', e.target.checked, false);
                        setMajorEvents(!majorEvents);
                      }}
                      defaultChecked={eventCategory && eventCategory == 'majorEvents' ? true : mapContext.visible_layers.majorEvents}
                    />
                    <label htmlFor="filter--major">
                      <span className="filter-item__icon">
                      <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg" alt="major delays" aria-hidden="true" focusable="false" role="img">
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
                        trackEvent('click', 'map', 'Toggle minor events layer')
                        toggleLayer('minorEvents', e.target.checked);
                        toggleLayer('minorEventsLines', e.target.checked, false);
                        setMinorEvents(!minorEvents);
                      }}
                      defaultChecked={eventCategory && eventCategory == 'minorEvents' ? true : mapContext.visible_layers.minorEvents}
                    />
                    <label htmlFor="filter--minor">
                      <span className="filter-item__icon">
                      <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg" alt="minor delays" aria-hidden="true" focusable="false" role="img">
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
                        trackEvent('click', 'map', 'Toggle future events layer')
                        toggleLayer('futureEvents', e.target.checked);
                        toggleLayer('futureEventsLines', e.target.checked, false);
                        setFutureEvents(!futureEvents);
                      }}
                      defaultChecked={eventCategory && eventCategory == 'futureEvents' ? true : mapContext.visible_layers.futureEvents}
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
                      onChange={e => {
                        trackEvent('click', 'map', 'Toggle highway cameras layer');
                        toggleLayer('highwayCams', e.target.checked);
                        setHighwayCams(!highwayCams);
                      }}
                      defaultChecked={isCamDetail || mapContext.visible_layers.highwayCams}
                      disabled={isCamDetail || disableFeatures}
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
                        trackEvent('click', 'map', 'Toggle road conditions layer')
                        toggleLayer('roadConditions', e.target.checked);
                        toggleLayer('roadConditionsLines', e.target.checked, false);
                        setRoadConditions(!roadConditions);
                      }}
                      defaultChecked={mapContext.visible_layers.roadConditions}
                      disabled={(disableFeatures && !enableRoadConditions)}
                    />
                    <label htmlFor="filter--road-conditions">
                      <span className="filter-item__icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" alt="road conditions" aria-hidden="true" focusable="false" role="img">
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
                      onChange={e => {
                        trackEvent('click', 'map', 'Toggle inland ferries layer')
                        toggleLayer('inlandFerries', e.target.checked); setInlandFerries(!inlandFerries)}}
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
                      onChange={e => {
                        trackEvent('click', 'map', 'Toggle weather layer')
                        toggleLayer('weather', e.target.checked);
                        toggleLayer('regional', e.target.checked);
                        setWeather(!weather)}
                      }
                      defaultChecked={mapContext.visible_layers.weather}
                      disabled={disableFeatures}
                    />
                    <label htmlFor="filter--weather">
                      <span className="filter-item__icon">
                        <FontAwesomeIcon icon={faSunCloud} alt="weather" />
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
                      onChange={e => {
                        trackEvent('click', 'map', 'Toggle rest stops layer')
                        toggleLayer('restStops', e.target.checked); setRestStops(!restStops)}}
                      defaultChecked={mapContext.visible_layers.restStops}
                      disabled={disableFeatures}
                    />
                    <label htmlFor="filter--rest-stops">
                      <span className="filter-item__icon">
                        <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg" alt="rest stops" aria-hidden="true" focusable="false" role="img">
                          <path className="filter-item__icon__path" d="M19 3C19 3.1875 18.9688 3.34375 18.9375 3.5C19.5625 3.9375 20 4.6875 20 5.5C20 6.90625 18.875 8 17.5 8H17L17 15C17 15.5625 16.5312 16 16 16C15.4375 16 15 15.5625 15 15V8H14.5C13.0937 8 12 6.90625 12 5.5C12 4.6875 12.4062 3.9375 13.0312 3.5C13 3.34375 13 3.1875 13 3C13 1.34375 14.3438 0 16 0C17.6562 0 19 1.34375 19 3ZM1 7C1 6.46875 1.4375 6 2 6L10 6C10.5312 6 11 6.46875 11 7V9C11 9.5625 10.5312 10 10 10L2 10C1.4375 10 1 9.5625 1 9L1 7ZM1 11L11 11C11.5312 11 12 11.4688 12 12C12 12.5625 11.5312 13 11 13V15C11 15.5625 10.5312 16 10 16C9.4375 16 9 15.5625 9 15V13L3 13L3 15C3 15.5625 2.53125 16 2 16C1.4375 16 1 15.5625 1 15L1 13C0.4375 13 0 12.5625 0 12C0 11.4688 0.4375 11 1 11Z"/>
                        </svg>
                      </span>
                      Rest stops
                    </label>
                    <OverlayTrigger placement="top" overlay={tooltipRestStops}>
                      <span className="tooltip-info">?</span>
                    </OverlayTrigger>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  );
}