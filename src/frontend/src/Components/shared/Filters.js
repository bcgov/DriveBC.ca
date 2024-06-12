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
      <p>Locations of rest stops run by the province.</p>
    </Tooltip>
  );
  const tooltipRestStopsLargeVehicle = (
    <Tooltip id="tooltip" className="tooltip-content">
      <p>Locations of rest stops run by the province 	&#40;greater than 20 metres in length&#41;.</p>
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
  const [largeRestStops, setLargeRestStops] = useState(mapContext.visible_layers.largeRestStops);

  // Helpers
  const setLayerVisibility = (layer, checked, runCallback=true) => {
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
                        setLayerVisibility('closures', !closures);
                        setLayerVisibility('closuresLines', !closures, false);
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
                        setLayerVisibility('majorEvents', !majorEvents);
                        setLayerVisibility('majorEventsLines', !majorEvents, false);
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
                        setLayerVisibility('minorEvents', !minorEvents);
                        setLayerVisibility('minorEventsLines', !minorEvents, false);
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
                        setLayerVisibility('futureEvents', !futureEvents);
                        setLayerVisibility('futureEventsLines', !futureEvents, false);
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
                        setLayerVisibility('highwayCams', !highwayCams);
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
                        setLayerVisibility('roadConditions', !roadConditions);
                        setLayerVisibility('roadConditionsLines', !roadConditions, false);
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
                        setLayerVisibility('inlandFerries', !inlandFerries); 
                        setInlandFerries(!inlandFerries)
                      }}
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
                        setLayerVisibility('weather', !weather);
                        setLayerVisibility('regional', !weather);
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
                        if (!restStops && largeRestStops) {
                          setLayerVisibility('largeRestStops', false);
                          setLargeRestStops(false);
                        }
                        setLayerVisibility('restStops', !restStops); 
                        setRestStops(!restStops);
                      }}
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

            <div className="filter-group">
              <p className="filter-group__title">Commercial vehicles</p>
              <div className="filter-items-group">
                <div className="filter-items filter-items--conditions">
                  <div className={'filter-item filter-item--rest-stops-large-vehicle' + (largeRestStops ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                    <input
                      type="checkbox"
                      name="large vehicle rest stops"
                      id="filter--rest-stops-large-vehicle"
                      onChange={e => {
                        trackEvent('click', 'map', 'Toggle large vehicle rest stops layer')
                        if (restStops && !largeRestStops) {
                          setLayerVisibility('restStops', false);
                          setRestStops(false);
                        }
                        setLayerVisibility('largeRestStops', !largeRestStops); 
                        setLargeRestStops(!largeRestStops);
                      }}
                      defaultChecked={mapContext.visible_layers.largeRestStops}
                      disabled={disableFeatures}
                    />
                    <label htmlFor="filter--rest-stops-large-vehicle">
                      <span className="filter-item__icon">
                        <svg width="30" height="14" viewBox="0 0 30 14" fill="none" xmlns="http://www.w3.org/2000/svg" alt="large vehicle rest stops" aria-hidden="true" focusable="false" role="img">
                          <path className="filter-item__icon__path" d="M16.375 2.67104C16.375 2.82647 16.3491 2.95599 16.3232 3.08551C16.8413 3.44818 17.2039 4.06989 17.2039 4.7434C17.2039 5.90911 16.2714 6.81577 15.1316 6.81577H14.7171V12.6184C14.7171 13.0847 14.3285 13.4473 13.8882 13.4473C13.4219 13.4473 13.0592 13.0847 13.0592 12.6184V6.81577H12.6447C11.479 6.81577 10.5724 5.90911 10.5724 4.7434C10.5724 4.06989 10.9091 3.44818 11.4272 3.08551C11.4013 2.95599 11.4013 2.82647 11.4013 2.67104C11.4013 1.2981 12.5152 0.184204 13.8882 0.184204C15.2611 0.184204 16.375 1.2981 16.375 2.67104ZM1.45398 5.98682C1.45398 5.54645 1.81664 5.15788 2.28292 5.15788H8.91448C9.35486 5.15788 9.74343 5.54645 9.74343 5.98682V7.64471C9.74343 8.111 9.35486 8.47366 8.91448 8.47366H2.28292C1.81664 8.47366 1.45398 8.111 1.45398 7.64471V5.98682ZM1.45398 9.3026H9.74343C10.1838 9.3026 10.5724 9.69117 10.5724 10.1315C10.5724 10.5978 10.1838 10.9605 9.74343 10.9605V12.6184C9.74343 13.0847 9.35486 13.4473 8.91448 13.4473C8.4482 13.4473 8.08554 13.0847 8.08554 12.6184V10.9605H3.11187V12.6184C3.11187 13.0847 2.7233 13.4473 2.28292 13.4473C1.81664 13.4473 1.45398 13.0847 1.45398 12.6184V10.9605C0.987694 10.9605 0.625031 10.5978 0.625031 10.1315C0.625031 9.69117 0.987694 9.3026 1.45398 9.3026Z"/>
                          <path className="filter-item__icon__path" d="M17.5855 2.62504C17.5855 1.48524 18.3914 0.552673 19.4276 0.552673H27.5329C28.546 0.552673 29.375 1.48524 29.375 2.62504V10.0855C29.375 10.785 29.0756 11.3808 28.6381 11.7434V12.9869C28.6381 13.4531 28.2927 13.8158 27.9013 13.8158H27.1645C26.75 13.8158 26.4276 13.4531 26.4276 12.9869V12.1579H20.5329V12.9869C20.5329 13.4531 20.1875 13.8158 19.796 13.8158H19.0592C18.6447 13.8158 18.3224 13.4531 18.3224 12.9869V11.7434C17.8618 11.3808 17.5855 10.785 17.5855 10.0855V2.62504ZM20.5559 4.51607L20.1645 6.35529H26.796L26.3816 4.51607C26.2895 4.1275 25.9901 3.86846 25.6677 3.86846H21.2928C20.9474 3.86846 20.648 4.1275 20.5789 4.51607H20.5559ZM20.5329 8.84213C20.5329 8.40175 20.1875 8.01318 19.796 8.01318C19.3816 8.01318 19.0592 8.40175 19.0592 8.84213C19.0592 9.30841 19.3816 9.67107 19.796 9.67107C20.1875 9.67107 20.5329 9.30841 20.5329 8.84213ZM27.1645 9.67107C27.5559 9.67107 27.9013 9.30841 27.9013 8.84213C27.9013 8.40175 27.5559 8.01318 27.1645 8.01318C26.75 8.01318 26.4276 8.40175 26.4276 8.84213C26.4276 9.30841 26.75 9.67107 27.1645 9.67107Z"/>
                        </svg>
                      </span>
                      Large vehicle rest stops
                    </label>
                    <OverlayTrigger placement="top" overlay={tooltipRestStopsLargeVehicle}>
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
