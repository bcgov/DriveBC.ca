// React
import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';

// Navigation
import { useSearchParams } from "react-router-dom";

// Redux
import { memoize } from 'proxy-memoize';
import { useSelector } from 'react-redux';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faCircleQuestion,
  faTruckContainer,
  faLayerGroup
} from '@fortawesome/pro-solid-svg-icons';
import { faLayerGroup as faLayerGroupOutline } from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Spinner from 'react-bootstrap/Spinner';
import Tooltip from 'react-bootstrap/Tooltip';

// Internal imports
import { MapContext } from '../../App.js';
import trackEvent from './TrackEvent';

// Styling
import './ListFilters.scss';

export default function ListFilters(props) {
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');
  const largeScreen = useMediaQuery('only screen and (min-width: 768px)');

  // Navigation
  const [searchParams] = useSearchParams();

  // Context
  const { mapContext, setMapContext } = useContext(MapContext);

  // Props
  const {
    hidden,
    mapLayers,
    disableFeatures,
    enableRoadConditions,
    enableChainUps,
    textOverride,
    iconOverride,
    isCamDetail,
    referenceData,
    loadingLayers,
    isDelaysPage,
    fullOverlay
  } = props;

  // Refs
  const isInitialLoad = useRef(true);

  // Redux
  const {
    routes: { searchedRoutes },

  } = useSelector(
    useCallback(
      memoize(state => ({
        routes: state.routes,
      })),
    ),
  );

  // Const for enabling layer that the reference event belongs to
  const eventCategory = referenceData ? referenceData.display_category : false;

  // States
  // Show layer menu by default on main page, desktop only
  const [open, setOpen] = useState(largeScreen && !textOverride);

  // States for toggles
  const chainUpsOnly = !isCamDetail && searchParams.get('chainUpsOnly') === 'true';
  const [closures, setClosures] = useState(chainUpsOnly ? false : (eventCategory && eventCategory == 'closures' ? true : mapContext.visible_layers.closures));
  const [majorEvents, setMajorEvents] = useState(chainUpsOnly ? false : (eventCategory && eventCategory == 'majorEvents' ? true : mapContext.visible_layers.majorEvents));
  const [minorEvents, setMinorEvents] = useState(chainUpsOnly ? false : (eventCategory && eventCategory == 'minorEvents' ? true : mapContext.visible_layers.minorEvents));
  const [futureEvents, setFutureEvents] = useState(chainUpsOnly ? false : (eventCategory && eventCategory == 'futureEvents' ? true : mapContext.visible_layers.futureEvents));
  const [roadConditions, setRoadConditions] = useState(chainUpsOnly ? false : mapContext.visible_layers.roadConditions);
  const [chainUps, setChainUps] = useState(chainUpsOnly ? true : mapContext.visible_layers.chainUps);
  const [highwayCams, setHighwayCams] = useState(chainUpsOnly ? false : (isCamDetail ? isCamDetail : mapContext.visible_layers.highwayCams));
  const [inlandFerries, setInlandFerries] = useState(chainUpsOnly ? false : mapContext.visible_layers.inlandFerries);
  const [weather, setWeather] = useState(chainUpsOnly ? false : mapContext.visible_layers.weather);
  const [restStops, setRestStops] = useState(chainUpsOnly ? false : mapContext.visible_layers.restStops);
  const [largeRestStops, setLargeRestStops] = useState(chainUpsOnly ? false : mapContext.visible_layers.largeRestStops);

  // Effects
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (searchedRoutes && !!searchedRoutes.length) {
      const visibleLayers = {};

      if (!closures) {
        visibleLayers.closures = true;
        visibleLayers.closuresLines = true;
        setClosures(true);
      }

      if (!majorEvents) {
        visibleLayers.majorEvents = true;
        visibleLayers.majorEventsLines = true;
        setMajorEvents(true);
      }

      if (!minorEvents) {
        visibleLayers.minorEvents = true;
        visibleLayers.minorEventsLines = true;
        setMinorEvents(true);
      }

      if (!futureEvents) {
        visibleLayers.futureEvents = true;
        visibleLayers.futureEventsLines = true;
        setFutureEvents(true);
      }

      if (!roadConditions) {
        visibleLayers.roadConditions = true;
        visibleLayers.roadConditionsLines = true;
        setRoadConditions(true);
      }

      if (!inlandFerries) {
        visibleLayers.inlandFerries = true;
        setInlandFerries(true);
      }

      if (Object.keys(visibleLayers).length > 0) {
        setLayerVisibility(visibleLayers);
      }
    }
  }, [searchedRoutes]);

  useEffect(() => {
    if (chainUpsOnly) {
      setLayerVisibility('chainUps', true);
      setLayerVisibility('chainUpsLines', true);
      setChainUps(true);
    }
  }, []);

  // Helpers

  /* IMPORTANT: This function triggers a context change, so repeated calls to
   * it (such as three calls to trigger three different layers) will create a
   * race condition where subsequent calls overwrite a previous call's changed
   * value.  This is because we're mutating a nested object.
   *
   * Call this function singly with either one layer and checked value, or an
   * object with key value pairs for the layers to toggle.
   */
  const setLayerVisibility = (layers, checked) => {
    if (typeof layers === 'string') { // a string, boolean was passed
      layers = {[layers]: checked}
    }

    for (const layer in layers) {
      if (mapLayers && mapLayers.current[layer]) {
        mapLayers.current[layer].setVisible(layers[layer]);
      }
    }

    const newMapContext = {
      ...mapContext,
      visible_layers: {
        ...mapContext.visible_layers,
        ...layers
      }
    };
    setMapContext(newMapContext);
    localStorage.setItem('mapContext', JSON.stringify(newMapContext));
  }

  // Set focus on filters with a blur out after 1 second
  function focusInput(filter) {
    filter.focus();

    // The input will lose focus after 1 second
    setTimeout(() => {
      filter.blur();
    }, 1000);
  }

  function updateUrl(type1, type2) {
    const currentUrl = window.location.href;
    const newUrl = currentUrl.replace(type1, type2);
    window.history.replaceState(null, "", newUrl);
  }

  // Handlers
  const filterHandler = (layer, e) => {
    switch (layer) {
      case 'closures':
        trackEvent('click', 'map', 'Toggle closures layer');
        setLayerVisibility({'closures': !closures, 'closuresLines': !closures});
        setClosures(!closures);
        break;
      case 'majorEvents':
        trackEvent('click', 'map', 'Toggle major events layer');
        setLayerVisibility({'majorEvents': !majorEvents, 'majorEventsLines': !majorEvents});
        setMajorEvents(!majorEvents);
        break;
      case 'minorEvents':
        trackEvent('click', 'map', 'Toggle minor events layer');
        setLayerVisibility({'minorEvents': !minorEvents, 'minorEventsLines': !minorEvents});
        setMinorEvents(!minorEvents);
        break;
      case 'futureEvents':
        trackEvent('click', 'map', 'Toggle future events layer');
        setLayerVisibility({'futureEvents': !futureEvents, 'futureEventsLines': !futureEvents});
        setFutureEvents(!futureEvents);
        break;
      case 'roadConditions':
        trackEvent('click', 'map', 'Toggle road conditions layer');
        setLayerVisibility({'roadConditions': !roadConditions, 'roadConditionsLines': !roadConditions});
        setRoadConditions(!roadConditions);
        break;
      case 'chainUps':
        trackEvent('click', 'map', 'Toggle chain ups layer')
        setLayerVisibility({'chainUps': !chainUps, 'chainUpsLines': !chainUps});
        setChainUps(!chainUps);
        break;
      case 'highwayCams':
        trackEvent('click', 'map', 'Toggle highway cameras layer');
        setLayerVisibility('highwayCams', !highwayCams);
        setHighwayCams(!highwayCams);
        break;
      case 'inlandFerries':
        trackEvent('click', 'map', 'Toggle ferries layer');
        setLayerVisibility('inlandFerries', !inlandFerries);
        setInlandFerries(!inlandFerries);
        break;
      case 'weather':
        trackEvent('click', 'map', 'Toggle weather layer')
        setLayerVisibility({'weather': !weather, 'regional': !weather, 'hef': !weather});
        setWeather(!weather);
        break;
      case 'restStops':
        trackEvent('click', 'map', 'Toggle rest stops layer')
        setLayerVisibility({'restStops': !restStops, 'largeRestStops': false});
        setRestStops(!restStops);
        setLargeRestStops(false);
        updateUrl("largeRestStop", "restStop");
        break;
      case 'largeRestStops':
        trackEvent('click', 'map', 'Toggle large rest stops layer')
        setLayerVisibility({'largeRestStops': !largeRestStops, 'restStops': false});
        setLargeRestStops(!largeRestStops);
        setRestStops(false);
        updateUrl("restStop", "largeRestStop");
        break;
    }

    if (e) {
      focusInput(e.target);
    }
  }

  // Rendering
  // Sub components
  const tooltipClosures = (
    <Tooltip id="tooltipClosures" className="tooltip-content">
      <p>Travel is not possible in one or both directions on this road. Find an alternate route or a detour where possible.</p>
    </Tooltip>
  );

  const tooltipMajor = (
    <Tooltip id="tooltipMajor" className="tooltip-content">
      <p>Expect delays of at least 30 minutes or more on this road. This could be due to a traffic incident, road work, or construction.</p>
    </Tooltip>
  );

  const tooltipMinor = (
    <Tooltip id="tooltipMinor" className="tooltip-content">
      <p>Expect delays up to 30 minutes on this road. This could be due to a traffic incident, road work, or construction.</p>
    </Tooltip>
  );

  const tooltipFutureEvents = (
    <Tooltip id="tooltipFutureEvents" className="tooltip-content">
      <p>Future road work or construction is planned for this road.</p>
    </Tooltip>
  );

  const tooltipHighwayCameras = (
    <Tooltip id="tooltipHighwayCameras" className="tooltip-content">
      <p>Look at recent pictures from cameras near the highway.</p>
    </Tooltip>
  );

  const tooltipRoadConditions = (
    <Tooltip id="tooltipRoadConditions" className="tooltip-content">
      <p>States of the road that may impact drivability.</p>
    </Tooltip>
  );

  const tooltipChainUps = (
    <Tooltip id="tooltipChainUps" className="tooltip-content">
      <p>Segments of the highway that require Commercial Vehicles over 11,794kg to have chains on in order to use the highway.</p>
    </Tooltip>
  );

  const tooltipFerries = (
    <Tooltip id="tooltipFerries" className="tooltip-content">
      <p>Travel requires the use of a ferry.</p>
    </Tooltip>
  );
  const tooltipWeather  = (
    <Tooltip id="tooltipWeather" className="tooltip-content">
      <p>Weather updates for roads.</p>
    </Tooltip>
  );
  const tooltipWildfires  = (
    <Tooltip id="tooltipWildfires" className="tooltip-content">
      <p>Active wildfires.</p>
    </Tooltip>
  );
  const tooltipRestStops = (
    <Tooltip id="tooltipRestStops" className="tooltip-content">
      <p>Locations of rest stops run by the province.</p>
    </Tooltip>
  );
  const tooltipRestStopsCommercialVehicles = (
    <Tooltip id="tooltipRestStopsCommercialVehicles" className="tooltip-content">
      <p>Locations of rest stops run by the province that can accommodate large vehicles	&#40;greater than 20 metres &#40;66 feet&#41; in length&#41;.</p>
    </Tooltip>
  );

  const tooltipCurrentRoutes = (
    <Tooltip id="tooltipCurrentRoutes" className="tooltip-content">
      <p>Map Layers are updated to show relevant layers for your routes. To revert to your previous settings, cancel the route search.</p>
    </Tooltip>
  );

  // Main Component
  return (
    <div className={`list-layers-filter filters-component filters ${hidden ? 'hidden' : ''}`}>
      {(!isDelaysPage || !smallScreen) &&
        <Button
          variant={isDelaysPage ? 'outline-primary' : 'primary'}
          className={'map-btn open-filters' + (open ? ' open' : '') + (isDelaysPage ? ' filter-option-btn' : '')}
          aria-label="open filters options"
          onClick={() => {
            open ? setOpen(false) : setOpen(true) }
          }>
          <FontAwesomeIcon icon={iconOverride ? faLayerGroupOutline : faLayerGroup } />
          <span className="filters-btn__text">{textOverride ? textOverride : 'Map Layers'}</span>
          {isDelaysPage && <span className="mobile-btn-text">Type</span>}
        </Button>
      }

      {open &&
        <div className={'filters legacy-filters-menu' + (isDelaysPage ? ' delays' : '')}>
          <div className="filters-title__container">
            <h4 className="filters-title">{textOverride ? textOverride : 'Map Layers'}</h4>
            {
              (mapLayers && mapLayers.current.routeLayer && mapLayers.current.routeLayer.rendered)
              &&
              <div className="filters-title__notification">
                Current routes
                <OverlayTrigger placement="top" overlay={tooltipCurrentRoutes}>
                  <button className="filters-title__tooltip-info" aria-label="current routes tooltip" aria-describedby="tooltipCurrentRoutes">
                    <FontAwesomeIcon icon={faCircleQuestion} />
                  </button>
                </OverlayTrigger>
              </div>
            }
            <button
              className="close-filters-legacy"
              aria-label="close filters options"
              onClick={() => setOpen(false)
            }>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className="filters-list">
            <div className="filter-group">
              <p className="filter-group__title">Delays</p>
              <div className="filter-items-group">
                <div className="filter-items filter-items--delays">
                  <div className={'filter-item filter-item--closures' + (closures ? ' checked' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                    <input
                      type="checkbox"
                      name="closures"
                      id="filter--closures"
                      onChange={e => filterHandler('closures', e)}
                      defaultChecked={eventCategory && eventCategory == 'closures' ? true : mapContext.visible_layers.closures}
                    />
                    <label className="filter-item__button" htmlFor="filter--closures">
                      <span className="filter-item__button__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="8" fill="#CE3E39"/>
                          <rect x="7" y="11" width="10" height="3" rx="1" fill="white"/>
                        </svg>
                      </span>
                      Closures
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipClosures}>
                      <button className="tooltip-info" aria-label="closures tooltip" aria-describedby="tooltipClosures">?</button>
                    </OverlayTrigger>

                    {loadingLayers && loadingLayers.events &&
                      <Spinner animation="border" role="status" />
                    }
                  </div>

                  <div className={'filter-item filter-item--major' + (majorEvents ? ' checked' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                    <input
                      type="checkbox"
                      name="major"
                      id="filter--major"
                      onChange={e => filterHandler('majorEvents', e)}
                      defaultChecked={eventCategory && eventCategory == 'majorEvents' ? true : mapContext.visible_layers.majorEvents}
                    />
                    <label className="filter-item__button" htmlFor="filter--major">
                      <span className="filter-item__button__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M4.65 13.58a2.24 2.24 0 0 1 0-3.16l5.77-5.77a2.24 2.24 0 0 1 3.16 0l5.77 5.77c.87.87.87 2.28 0 3.16l-5.77 5.77c-.87.87-2.28.87-3.16 0l-5.77-5.77Zm8.14-6.56a1.11 1.11 0 0 0-1.58 0l-4.19 4.19a1.11 1.11 0 0 0 0 1.58l4.19 4.19c.44.44 1.14.44 1.58 0l4.19-4.19c.44-.44.44-1.14 0-1.58l-4.19-4.19Z" />
                        </svg>
                      </span>
                      Major
                    </label>
                    <OverlayTrigger placement="top" overlay={tooltipMajor}>
                      <button className="tooltip-info" aria-label="major events tooltip" aria-describedby="tooltipMajor">?</button>
                    </OverlayTrigger>

                    {loadingLayers && loadingLayers.events &&
                      <Spinner animation="border" role="status" />
                    }
                  </div>

                  <div className={'filter-item filter-item--minor' + (minorEvents ? ' checked' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                    <input
                      type="checkbox"
                      name="minor"
                      id="filter--minor"
                      onChange={e => filterHandler('minorEvents', e)}
                      defaultChecked={eventCategory && eventCategory == 'minorEvents' ? true : mapContext.visible_layers.minorEvents}
                    />
                    <label className="filter-item__button" htmlFor="filter--minor">
                      <span className="filter-item__button__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12,18.25h0c-.59,0-1.14-.29-1.47-.79l-5.97-8.96c-.36-.54-.4-1.24-.09-1.81.31-.58.91-.93,1.56-.93h11.94c.65,0,1.25.36,1.56.93.31.58.27,1.27-.09,1.82l-5.97,8.96c-.33.49-.88.79-1.47.79ZM7.28,8.34l4.6,6.89c.06.09.19.09.24,0l4.6-6.89c.07-.1,0-.23-.12-.23H7.4c-.12,0-.19.13-.12.23Z"/>
                      </svg>
                      </span>
                      Minor
                    </label>
                    <OverlayTrigger placement="top" overlay={tooltipMinor}>
                      <button className="tooltip-info" aria-label="minor events tooltip" aria-describedby="tooltipMinor">?</button>
                    </OverlayTrigger>

                    {loadingLayers && loadingLayers.events &&
                      <Spinner animation="border" role="status" />
                    }
                  </div>

                  <div className={'filter-item filter-item--future-events' + (futureEvents ? ' checked' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                    <input
                      type="checkbox"
                      name="future events"
                      id="filter--future-events"
                      onChange={e => filterHandler('futureEvents', e)}
                      defaultChecked={eventCategory && eventCategory == 'futureEvents' ? true : mapContext.visible_layers.futureEvents} />

                    <label className="filter-item__button" htmlFor="filter--future-events">
                      <span className="filter-item__button__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 5.5C10.3984 5.5 10.75 5.85156 10.75 6.25V7H13.75V6.25C13.75 5.85156 14.0781 5.5 14.5 5.5C14.8984 5.5 15.25 5.85156 15.25 6.25V7L16.375 7C16.9844 7 17.5 7.51563 17.5 8.125V9.25L7 9.25V8.125C7 7.51562 7.49219 7 8.125 7H9.25V6.25C9.25 5.85156 9.57812 5.5 10 5.5ZM7 10L17.5 10V16.375C17.5 17.0078 16.9844 17.5 16.375 17.5H8.125C7.49219 17.5 7 17.0078 7 16.375L7 10ZM8.5 11.875V12.625C8.5 12.8359 8.66406 13 8.875 13H9.625C9.8125 13 10 12.8359 10 12.625V11.875C10 11.6875 9.8125 11.5 9.625 11.5H8.875C8.66406 11.5 8.5 11.6875 8.5 11.875ZM11.5 11.875V12.625C11.5 12.8359 11.6641 13 11.875 13L12.625 13C12.8125 13 13 12.8359 13 12.625V11.875C13 11.6875 12.8125 11.5 12.625 11.5L11.875 11.5C11.6641 11.5 11.5 11.6875 11.5 11.875ZM14.875 11.5C14.6641 11.5 14.5 11.6875 14.5 11.875V12.625C14.5 12.8359 14.6641 13 14.875 13H15.625C15.8125 13 16 12.8359 16 12.625V11.875C16 11.6875 15.8125 11.5 15.625 11.5H14.875ZM8.5 14.875V15.625C8.5 15.8359 8.66406 16 8.875 16H9.625C9.8125 16 10 15.8359 10 15.625V14.875C10 14.6875 9.8125 14.5 9.625 14.5H8.875C8.66406 14.5 8.5 14.6875 8.5 14.875ZM11.875 14.5C11.6641 14.5 11.5 14.6875 11.5 14.875V15.625C11.5 15.8359 11.6641 16 11.875 16H12.625C12.8125 16 13 15.8359 13 15.625V14.875C13 14.6875 12.8125 14.5 12.625 14.5L11.875 14.5ZM14.5 14.875V15.625C14.5 15.8359 14.6641 16 14.875 16H15.625C15.8125 16 16 15.8359 16 15.625V14.875C16 14.6875 15.8125 14.5 15.625 14.5H14.875C14.6641 14.5 14.5 14.6875 14.5 14.875Z" fill="#474543"/>
                        </svg>
                      </span>
                      Future events
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipFutureEvents}>
                      <button className="tooltip-info" aria-label="future events tooltip" aria-describedby="tooltipFutureEvents">?</button>
                    </OverlayTrigger>

                    {loadingLayers && loadingLayers.events &&
                      <Spinner animation="border" role="status" />
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="filter-group">
              <p className="filter-group__title">Conditions and features</p>
              <div className="filter-items-group">
                <div className="filter-items filter-items--conditions">
                  <div className={'filter-item filter-item--highway-cameras' + (highwayCams ? ' checked' : '') + (disableFeatures ? ' disabled' : '') + ((loadingLayers && loadingLayers.cameras) ? ' loading' : '')}>
                    <input
                      type="checkbox"
                      name="highway cameras"
                      id="filter--highway-cameras"
                      onChange={e => filterHandler('highwayCams', e)}
                      defaultChecked={isCamDetail || mapContext.visible_layers.highwayCams}
                      disabled={isCamDetail || disableFeatures} />

                    <label className="filter-item__button" htmlFor="filter--highway-cameras">
                      <span className="filter-item__button__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 9.75C6 9.06641 6.54687 8.5 7.25 8.5H12.25C12.9336 8.5 13.5 9.06641 13.5 9.75L13.5 14.75C13.5 15.4531 12.9336 16 12.25 16H7.25C6.54687 16 6 15.4531 6 14.75L6 9.75ZM16.918 9.20313C17.1133 9.32031 17.25 9.53516 17.25 9.75V14.75C17.25 14.9844 17.1133 15.1992 16.918 15.3164C16.7031 15.4141 16.4688 15.4141 16.2734 15.2773L14.3984 14.0273L14.125 13.8516V13.5V11V10.668L14.3984 10.4922L16.2734 9.24219C16.4688 9.10547 16.7031 9.10547 16.918 9.20313Z" fill="#053662"/>
                        </svg>
                      </span>
                      Highway cameras
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipHighwayCameras}>
                      <button className="tooltip-info" aria-label="highway cameras tooltip" aria-describedby="tooltipHighwayCameras">?</button>
                    </OverlayTrigger>

                    {loadingLayers && loadingLayers.cameras &&
                      <Spinner animation="border" role="status" />
                    }
                  </div>

                  <div className={'filter-item filter-item--road-conditions' + (roadConditions ? ' checked' : '') + ((disableFeatures && !enableRoadConditions) ? ' disabled' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                    <input
                      type="checkbox"
                      name="road conditions"
                      id="filter--road-conditions"
                      onChange={e => filterHandler('roadConditions', e)}
                      defaultChecked={mapContext.visible_layers.roadConditions}
                      disabled={(disableFeatures && !enableRoadConditions)}
                    />
                    <label className="filter-item__button" htmlFor="filter--road-conditions">
                      <span className="filter-item__button__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="m18.68 11.22-5.91-5.91c-.44-.41-1.12-.41-1.56 0l-5.9 5.91c-.41.44-.41 1.12 0 1.56l5.91 5.91c.44.41 1.12.41 1.56 0l5.91-5.91c.41-.44.41-1.12 0-1.56Zm-7.42 1.09L8.9 14.67a.46.46 0 0 1-.62 0l-2.36-2.36a.46.46 0 0 1 0-.62l2.36-2.36a.46.46 0 0 1 .62 0l2.36 2.36c.16.17.16.45 0 .62Zm6.84 0-2.36 2.36a.46.46 0 0 1-.62 0l-2.36-2.36a.46.46 0 0 1 0-.62l2.36-2.36a.46.46 0 0 1 .62 0l2.36 2.36c.16.17.16.45 0 .62Z" />
                        </svg>
                      </span>
                      Road conditions
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipRoadConditions}>
                      <button className="tooltip-info" aria-label="road conditions tooltip" aria-describedby="tooltipRoadConditions">?</button>
                    </OverlayTrigger>

                    {loadingLayers && loadingLayers.events &&
                      <Spinner animation="border" role="status" />
                    }
                  </div>

                  <div className={'filter-item filter-item--inland-ferries' + (inlandFerries ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                    <input
                      type="checkbox"
                      name="ferries"
                      id="filter--inland-ferries"
                      onChange={e => filterHandler('inlandFerries', e)}
                      defaultChecked={mapContext.visible_layers.inlandFerries}
                      disabled={disableFeatures}
                    />

                    <label className="filter-item__button" htmlFor="filter--inland-ferries">
                      <span className="filter-item__button__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10.8125 6.375L13.5625 6.375C13.9277 6.375 14.25 6.69727 14.25 7.0625L15.8613 7.0625C16.291 7.0625 16.5273 7.59961 16.248 7.92188L15.7969 8.4375L8.57812 8.4375L8.10547 7.92188C7.82617 7.59961 8.0625 7.0625 8.49219 7.0625L10.125 7.0625C10.125 6.69727 10.4258 6.375 10.8125 6.375ZM8.0625 9.125L16.3125 9.125C16.6777 9.125 17 9.44727 17 9.8125V12.4766C17 12.7559 16.8926 13.0352 16.7422 13.2715L15.625 14.8184C15.582 14.8398 15.5605 14.8613 15.5176 14.9043C15.1738 15.1191 14.7871 15.291 14.4219 15.3125H14.0566C13.6914 15.291 13.3047 15.1191 12.9609 14.9043C12.4883 14.5605 11.8652 14.5605 11.3926 14.9043C11.0703 15.1191 10.6836 15.291 10.2969 15.3125H9.93164C9.56641 15.291 9.17969 15.1191 8.83594 14.9043C8.81445 14.8613 8.77148 14.8398 8.72852 14.8184L7.61133 13.2715C7.46094 13.0352 7.375 12.7559 7.375 12.4766L7.375 9.8125C7.375 9.44727 7.67578 9.125 8.0625 9.125ZM8.75 10.5V12.5625L15.625 12.5625V10.5L8.75 10.5ZM12.5742 15.4414C13.0684 15.7852 13.6484 16 14.25 16C14.8086 16 15.4316 15.7852 15.9043 15.4414C16.1621 15.2695 16.5059 15.291 16.7422 15.4844C17.0645 15.7422 17.4512 15.9355 17.8379 16.0215C18.2031 16.1074 18.4395 16.4727 18.3535 16.8594C18.2676 17.2246 17.8809 17.4609 17.5156 17.375C17 17.2461 16.5488 17.0098 16.2695 16.8379C15.6465 17.1602 14.959 17.375 14.25 17.375C13.5625 17.375 12.9395 17.1816 12.5098 16.9883C12.3809 16.9238 12.2734 16.8594 12.1875 16.8164C12.0801 16.8594 11.9727 16.9238 11.8437 16.9883C11.4141 17.1816 10.791 17.375 10.125 17.375C9.41602 17.375 8.70703 17.1602 8.08398 16.8379C7.80469 17.0098 7.35352 17.2461 6.83789 17.375C6.47266 17.4609 6.08594 17.2246 6 16.8594C5.91406 16.4941 6.15039 16.1074 6.51562 16.0215C6.90234 15.9355 7.31055 15.7422 7.61133 15.4844C7.84766 15.291 8.19141 15.2695 8.44922 15.4414C8.92187 15.7852 9.54492 16 10.125 16C10.7051 16 11.3066 15.7852 11.7793 15.4414C12.0156 15.2695 12.3379 15.2695 12.5742 15.4414Z" fill="#42814A"/>
                        </svg>
                      </span>
                      Ferries
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipFerries}>
                      <button className="tooltip-info" aria-label="ferries tooltip" aria-describedby="tooltipFerries">?</button>
                    </OverlayTrigger>
                  </div>

                  <div className={'filter-item filter-item--weather' + (weather ? ' checked' : '') + ((loadingLayers && loadingLayers.weathers) ? ' loading' : '') + (isDelaysPage ? ' disabled' : '')}>
                    <input
                      type="checkbox"
                      name="weather"
                      id="filter--weather"
                      onChange={e => filterHandler('weather', e)}
                      defaultChecked={mapContext.visible_layers.weather}
                      disabled={isDelaysPage} />

                    <label className="filter-item__button" htmlFor="filter--weather">
                      <span className="filter-item__button__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.4609 5.54688C13.5781 5.59375 13.6719 5.6875 13.6953 5.82813L14.1641 8.33594L16.6719 8.80469C16.8125 8.82813 16.9062 8.92188 16.9531 9.03906C17 9.15625 17 9.29688 16.9297 9.39063L16.4609 10.0703C16.2734 10.0234 16.0625 10 15.875 10C15.1016 10 14.3984 10.3516 13.9297 10.8672C13.625 9.53125 12.4297 8.5 11 8.5C9.33594 8.5 8 9.85938 8 11.5C8 13.1641 9.33594 14.5 11 14.5C11.2812 14.5 11.5625 14.4766 11.8203 14.3828C12.1016 15.2969 12.9219 15.9766 13.9062 16L13.6953 17.1953C13.6719 17.3359 13.5781 17.4297 13.4609 17.4766C13.3437 17.5234 13.2031 17.5234 13.1094 17.4531L11 15.9766L8.86719 17.4531C8.77344 17.5234 8.63281 17.5234 8.51562 17.4766C8.39844 17.4297 8.30469 17.3359 8.28125 17.1953L7.83594 14.6641L5.30469 14.2188C5.16406 14.1953 5.07031 14.1016 5.02344 13.9844C4.97656 13.8672 4.97656 13.7266 5.04687 13.6328L6.52344 11.5L5.04687 9.39062C4.97656 9.29688 4.97656 9.15625 5.02344 9.03906C5.07031 8.92188 5.16406 8.82812 5.30469 8.80469L7.83594 8.33594L8.28125 5.82812C8.30469 5.6875 8.39844 5.59375 8.51562 5.54688C8.63281 5.5 8.77344 5.5 8.86719 5.57031L11 7.04688L13.1094 5.57031C13.2031 5.5 13.3438 5.5 13.4609 5.54688ZM13.25 11.5C13.25 11.5469 13.2266 11.5938 13.2266 11.6406C12.4062 11.9453 11.7969 12.7188 11.75 13.6328C11.5156 13.7266 11.2578 13.75 10.9766 13.75C9.73437 13.75 8.72656 12.7422 8.72656 11.5C8.72656 10.2578 9.73438 9.25 10.9766 9.25C12.2188 9.25 13.2266 10.2578 13.2266 11.5H13.25ZM14 15.25C13.1562 15.25 12.5 14.5938 12.5 13.75C12.5 12.9297 13.1562 12.25 14 12.25H14.0234C14.2109 11.4063 14.9609 10.75 15.875 10.75C16.6953 10.75 17.375 11.2891 17.6328 12.0156C17.8438 11.9453 18.0547 11.875 18.3125 11.875C19.2266 11.875 20 12.6484 20 13.5625C20 14.5 19.2266 15.25 18.3125 15.25H14Z" fill="#474543"/>
                        </svg>
                      </span>
                      Weather
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipWeather}>
                      <button className="tooltip-info" aria-label="weather tooltip" aria-describedby="tooltipWeather">?</button>
                    </OverlayTrigger>

                    {loadingLayers && loadingLayers.weathers &&
                      <Spinner animation="border" role="status" />
                    }
                  </div>

                  <div className={'filter-item filter-item--wildfires disabled'}>
                    <input
                      type="checkbox"
                      name="wildfires"
                      id="filter--wildfires"
                      disabled={true} />

                    <label className="filter-item__button" htmlFor="filter--wildfires">
                      <span className="filter-item__button__icon">
                        <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.3906 5.47687L14.2111 5.7538C13.7175 6.3538 13.2688 6.53842 12.6406 6.53842C11.6085 6.53842 10.8008 5.70765 10.8008 4.59995V2.19995C10.8008 2.19995 4.47388 5.56918 4.47388 11.1218C4.47388 14.8737 7.52517 17.8 10.9355 17.8C14.6482 17.8 17.4867 14.7076 17.5315 11.2923C17.5613 9.03091 16.3982 6.64828 14.3906 5.47687ZM10.9803 16.4615C10.0563 16.4615 9.14058 15.7692 9.14058 14.6153C9.14058 13.9006 9.4496 13.5448 9.7688 13.2308L10.9803 11.9846L12.4162 13.4153C12.727 13.7294 12.8649 14.2461 12.8649 14.7538C12.8649 15.5384 12.1021 16.4615 10.9803 16.4615ZM14.0315 15.4923C14.0651 15.1867 14.4925 13.6674 13.3585 12.5384L10.9695 10.1846L8.64695 12.5384C7.50455 13.6759 7.89541 15.2036 7.92901 15.4923C7.43542 15.123 6.53799 14.1538 6.22388 13.323C5.92835 12.6643 5.73023 11.8452 5.73029 11.1218C5.73029 8.19995 8.15337 5.56918 9.49953 4.6461C9.49953 5.47687 9.91401 6.44468 10.5316 6.99995C11.1492 7.55522 11.8139 7.82948 12.6406 7.83072C13.2958 7.83072 13.9875 7.59572 14.5251 7.23072C15.6021 8.1538 16.2308 9.72043 16.2302 11.1076C16.2751 13.0923 15.1982 14.6615 14.0315 15.4923Z"/>
                        </svg>
                      </span>
                      Wildfires
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipWildfires}>
                      <button className="tooltip-info" aria-label="wildfires tooltip" aria-describedby="tooltipWildfires">?</button>
                    </OverlayTrigger>
                  </div>

                  <div className={'filter-item filter-item--rest-stops' + (restStops ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                    <input
                      type="checkbox"
                      name="rest stops"
                      id="filter--rest-stops"
                      onChange={e => filterHandler('restStops', e)}
                      defaultChecked={mapContext.visible_layers.restStops}
                      disabled={disableFeatures}
                    />
                    <label className="filter-item__button" htmlFor="filter--rest-stops">
                      <span className="filter-item__button__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.0625 8.4375C18.0625 8.56641 18.041 8.67383 18.0195 8.78125C18.4492 9.08203 18.75 9.59766 18.75 10.1563C18.75 11.123 17.9766 11.875 17.0312 11.875H16.6875V16.6875C16.6875 17.0742 16.3652 17.375 16 17.375C15.6133 17.375 15.3125 17.0742 15.3125 16.6875V11.875H14.9687C14.002 11.875 13.25 11.123 13.25 10.1562C13.25 9.59766 13.5293 9.08203 13.959 8.78125C13.9375 8.67383 13.9375 8.56641 13.9375 8.4375C13.9375 7.29883 14.8613 6.375 16 6.375C17.1387 6.375 18.0625 7.29883 18.0625 8.4375ZM5.6875 11.1875C5.6875 10.8223 5.98828 10.5 6.375 10.5H11.875C12.2402 10.5 12.5625 10.8223 12.5625 11.1875L12.5625 12.5625C12.5625 12.9492 12.2402 13.25 11.875 13.25L6.375 13.25C5.98828 13.25 5.6875 12.9492 5.6875 12.5625V11.1875ZM5.6875 13.9375L12.5625 13.9375C12.9277 13.9375 13.25 14.2598 13.25 14.625C13.25 15.0117 12.9277 15.3125 12.5625 15.3125V16.6875C12.5625 17.0742 12.2402 17.375 11.875 17.375C11.4883 17.375 11.1875 17.0742 11.1875 16.6875V15.3125L7.0625 15.3125V16.6875C7.0625 17.0742 6.74023 17.375 6.375 17.375C5.98828 17.375 5.6875 17.0742 5.6875 16.6875V15.3125C5.30078 15.3125 5 15.0117 5 14.625C5 14.2598 5.30078 13.9375 5.6875 13.9375Z" fill="#273F94"/>
                        </svg>
                      </span>
                      Rest stops
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipRestStops}>
                      <button className="tooltip-info" aria-label="rest stops tooltip" aria-describedby="tooltipRestStops">?</button>
                    </OverlayTrigger>
                  </div>
                </div>
              </div>
            </div>

            <div className="filter-group">
              <p className="filter-group__title">Commercial vehicles</p>
              <div className="filter-items-group">
                <div className="filter-items filter-items--conditions">
                  <div className={'filter-item filter-item--chain-ups' + (chainUps ? ' checked' : '') + ((disableFeatures && !enableChainUps) ? ' disabled' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                    <input
                      type="checkbox"
                      name="chain ups"
                      id="filter--chain-ups"
                      onChange={e => filterHandler('chainUps', e)}
                      defaultChecked={mapContext.visible_layers.chainUps}
                      disabled={(disableFeatures && !enableChainUps)}
                    />
                    <label className="filter-item__button" htmlFor="filter--chain-ups">
                      <span className="filter-item__button__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.6 7H11.575C13.575 7 15.2 8.69271 15.175 10.776C15.175 12.625 13.9 14.1875 12.175 14.5H12.125C11.675 14.5781 11.275 14.2656 11.2 13.8229C11.125 13.3542 11.425 12.9375 11.85 12.8594H11.9C12.875 12.6771 13.6 11.7917 13.6 10.776C13.6 9.63021 12.675 8.66667 11.575 8.66667H7.6C6.5 8.66667 5.6 9.63021 5.6 10.776C5.6 11.7917 6.3 12.6771 7.275 12.8594H7.325C7.75 12.9375 8.05 13.3542 7.975 13.8229C7.9 14.2656 7.5 14.5781 7.05 14.5H7C5.275 14.1875 4 12.625 4 10.776C4 8.69271 5.6 7 7.6 7ZM16.375 17H12.4C10.4 17 8.8 15.3333 8.8 13.25C8.8 11.401 10.075 9.83854 11.825 9.52604H11.85C12.3 9.44792 12.7 9.76042 12.775 10.2031C12.85 10.6719 12.55 11.0885 12.125 11.1667H12.075C11.1 11.349 10.4 12.2083 10.4 13.25C10.4 14.3958 11.3 15.3333 12.4 15.3333H16.375C17.5 15.3333 18.4 14.3958 18.4 13.25C18.4 12.2083 17.675 11.349 16.7 11.1667H16.65C16.225 11.0885 15.925 10.6719 16 10.2031C16.075 9.76042 16.475 9.44792 16.925 9.52604H16.975C18.7 9.83854 20 11.401 20 13.25C20 15.3333 18.375 17 16.375 17Z" fill="#474543"/>
                      </svg>
                      </span>
                      Chain-ups in effect
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipChainUps}>
                      <button className="tooltip-info" aria-label="chain ups tooltip" aria-describedby="tooltipChainUps">?</button>
                    </OverlayTrigger>

                    {loadingLayers && loadingLayers.events &&
                      <Spinner animation="border" role="status" />
                    }
                  </div>

                  <div className={'filter-item filter-item--rest-stops-large-vehicle' + (largeRestStops ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                    <input
                      type="checkbox"
                      name="rest stops"
                      id="filter--rest-stops-large-vehicle"
                      onChange={e => filterHandler('largeRestStops', e)}
                      defaultChecked={mapContext.visible_layers.largeRestStops}
                      disabled={disableFeatures} />

                    <label className="filter-item__button" htmlFor="filter--rest-stops-large-vehicle">
                      <span className="filter-item__button__icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 9.42105C13 9.50986 12.9852 9.58388 12.9704 9.65789C13.2664 9.86513 13.4737 10.2204 13.4737 10.6053C13.4737 11.2714 12.9408 11.7895 12.2894 11.7895H12.0526V15.1052C12.0526 15.3717 11.8306 15.5789 11.5789 15.5789C11.3125 15.5789 11.1052 15.3717 11.1052 15.1052V11.7895H10.8684C10.2023 11.7895 9.68419 11.2714 9.68419 10.6053C9.68419 10.2204 9.87663 9.86513 10.1727 9.65789C10.1579 9.58388 10.1579 9.50986 10.1579 9.42105C10.1579 8.63651 10.7944 8 11.5789 8C12.3635 8 13 8.63651 13 9.42105ZM4.47368 11.3158C4.47368 11.0641 4.68092 10.8421 4.94737 10.8421H8.73683C8.98847 10.8421 9.21051 11.0641 9.21051 11.3158V12.2631C9.21051 12.5296 8.98847 12.7368 8.73683 12.7368H4.94737C4.68092 12.7368 4.47368 12.5296 4.47368 12.2631V11.3158ZM4.47368 13.2105H9.21051C9.46215 13.2105 9.68419 13.4325 9.68419 13.6842C9.68419 13.9506 9.46215 14.1579 9.21051 14.1579V15.1052C9.21051 15.3717 8.98847 15.5789 8.73683 15.5789C8.47038 15.5789 8.26314 15.3717 8.26314 15.1052V14.1579H5.42105V15.1052C5.42105 15.3717 5.19901 15.5789 4.94737 15.5789C4.68092 15.5789 4.47368 15.3717 4.47368 15.1052V14.1579C4.20724 14.1579 4 13.9506 4 13.6842C4 13.4325 4.20724 13.2105 4.47368 13.2105Z" fill="#273F94"/>
                          <path d="M13.7896 9.60511C13.7896 8.95379 14.2501 8.4209 14.8422 8.4209H19.4737C20.0527 8.4209 20.5264 8.95379 20.5264 9.60511V13.8683C20.5264 14.2679 20.3553 14.6084 20.1053 14.8156V15.5261C20.1053 15.7926 19.908 15.9998 19.6843 15.9998H19.2632C19.0264 15.9998 18.8422 15.7926 18.8422 15.5261V15.0525H15.4738V15.5261C15.4738 15.7926 15.2764 15.9998 15.0527 15.9998H14.6317C14.3948 15.9998 14.2106 15.7926 14.2106 15.5261V14.8156C13.9474 14.6084 13.7896 14.2679 13.7896 13.8683V9.60511ZM15.4869 10.6857L15.2632 11.7367H19.0527L18.8159 10.6857C18.7632 10.4637 18.5922 10.3156 18.408 10.3156H15.908C15.7106 10.3156 15.5395 10.4637 15.5001 10.6857H15.4869ZM15.4738 13.1577C15.4738 12.9061 15.2764 12.684 15.0527 12.684C14.8159 12.684 14.6317 12.9061 14.6317 13.1577C14.6317 13.4242 14.8159 13.6314 15.0527 13.6314C15.2764 13.6314 15.4738 13.4242 15.4738 13.1577ZM19.2632 13.6314C19.4869 13.6314 19.6843 13.4242 19.6843 13.1577C19.6843 12.9061 19.4869 12.684 19.2632 12.684C19.0264 12.684 18.8422 12.9061 18.8422 13.1577C18.8422 13.4242 19.0264 13.6314 19.2632 13.6314Z" fill="#273F94"/>
                        </svg>
                      </span>
                      Rest stops
                    </label>

                    <OverlayTrigger placement="top" overlay={tooltipRestStopsCommercialVehicles}>
                      <button className="tooltip-info" aria-label="rest stops" aria-describedby="tooltipRestStopsCommercialVehicles">?</button>
                    </OverlayTrigger>
                  </div>
                  <div className="filter-item filter-item--seasonal-load">
                    <FontAwesomeIcon icon={faTruckContainer} />
                    <a className="seasonal-load-link" href="https://www.th.gov.bc.ca/bchighways/loadrestrictions/loadrestrictions.htm" rel="noopener noreferrer" alt="Seasonal load restrictions">Seasonal load restrictions</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      {fullOverlay &&
        <div className="filters-list">
          <div className="filter-group">
            <p className="filter-group__title">Delays</p>
            <div className="filter-items-group">
              <div className="filter-items filter-items--delays">
                <div className={'filter-item filter-item--closures' + (closures ? ' checked' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                  <input
                    type="checkbox"
                    name="closures"
                    id="filter--closures"
                    onChange={e => filterHandler('closures', e)}
                    defaultChecked={eventCategory && eventCategory == 'closures' ? true : mapContext.visible_layers.closures}
                  />
                  <label className="filter-item__button" htmlFor="filter--closures">
                    <span className="filter-item__button__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#CE3E39"/>
                        <rect x="7" y="11" width="10" height="3" rx="1" fill="white"/>
                      </svg>
                    </span>
                    Closures
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipClosures}>
                    <button className="tooltip-info" aria-label="closures tooltip" aria-describedby="tooltipClosures">?</button>
                  </OverlayTrigger>

                  {loadingLayers && loadingLayers.events &&
                    <Spinner animation="border" role="status" />
                  }
                </div>

                <div className={'filter-item filter-item--major' + (majorEvents ? ' checked' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                  <input
                    type="checkbox"
                    name="major"
                    id="filter--major"
                    onChange={e => filterHandler('majorEvents', e)}
                    defaultChecked={eventCategory && eventCategory == 'majorEvents' ? true : mapContext.visible_layers.majorEvents}
                  />
                  <label className="filter-item__button" htmlFor="filter--major">
                    <span className="filter-item__button__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M4.65 13.58a2.24 2.24 0 0 1 0-3.16l5.77-5.77a2.24 2.24 0 0 1 3.16 0l5.77 5.77c.87.87.87 2.28 0 3.16l-5.77 5.77c-.87.87-2.28.87-3.16 0l-5.77-5.77Zm8.14-6.56a1.11 1.11 0 0 0-1.58 0l-4.19 4.19a1.11 1.11 0 0 0 0 1.58l4.19 4.19c.44.44 1.14.44 1.58 0l4.19-4.19c.44-.44.44-1.14 0-1.58l-4.19-4.19Z" />
                      </svg>
                    </span>
                    Major
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipMajor}>
                    <button className="tooltip-info" aria-label="major events tooltip" aria-describedby="tooltipMajor">?</button>
                  </OverlayTrigger>

                  {loadingLayers && loadingLayers.events &&
                    <Spinner animation="border" role="status" />
                  }
                </div>

                <div className={'filter-item filter-item--minor' + (minorEvents ? ' checked' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                  <input
                    type="checkbox"
                    name="minor"
                    id="filter--minor"
                    onChange={e => filterHandler('minorEvents', e)}
                    defaultChecked={eventCategory && eventCategory == 'minorEvents' ? true : mapContext.visible_layers.minorEvents}
                  />
                  <label className="filter-item__button" htmlFor="filter--minor">
                    <span className="filter-item__button__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M12,18.25h0c-.59,0-1.14-.29-1.47-.79l-5.97-8.96c-.36-.54-.4-1.24-.09-1.81.31-.58.91-.93,1.56-.93h11.94c.65,0,1.25.36,1.56.93.31.58.27,1.27-.09,1.82l-5.97,8.96c-.33.49-.88.79-1.47.79ZM7.28,8.34l4.6,6.89c.06.09.19.09.24,0l4.6-6.89c.07-.1,0-.23-.12-.23H7.4c-.12,0-.19.13-.12.23Z"/>
                    </svg>
                    </span>
                    Minor
                  </label>
                  <OverlayTrigger placement="top" overlay={tooltipMinor}>
                    <button className="tooltip-info" aria-label="minor events tooltip" aria-describedby="tooltipMinor">?</button>
                  </OverlayTrigger>

                  {loadingLayers && loadingLayers.events &&
                    <Spinner animation="border" role="status" />
                  }
                </div>

                <div className={'filter-item filter-item--future-events' + (futureEvents ? ' checked' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                  <input
                    type="checkbox"
                    name="future events"
                    id="filter--future-events"
                    onChange={e => filterHandler('futureEvents', e)}
                    defaultChecked={eventCategory && eventCategory == 'futureEvents' ? true : mapContext.visible_layers.futureEvents} />

                  <label className="filter-item__button" htmlFor="filter--future-events">
                    <span className="filter-item__button__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 5.5C10.3984 5.5 10.75 5.85156 10.75 6.25V7H13.75V6.25C13.75 5.85156 14.0781 5.5 14.5 5.5C14.8984 5.5 15.25 5.85156 15.25 6.25V7L16.375 7C16.9844 7 17.5 7.51563 17.5 8.125V9.25L7 9.25V8.125C7 7.51562 7.49219 7 8.125 7H9.25V6.25C9.25 5.85156 9.57812 5.5 10 5.5ZM7 10L17.5 10V16.375C17.5 17.0078 16.9844 17.5 16.375 17.5H8.125C7.49219 17.5 7 17.0078 7 16.375L7 10ZM8.5 11.875V12.625C8.5 12.8359 8.66406 13 8.875 13H9.625C9.8125 13 10 12.8359 10 12.625V11.875C10 11.6875 9.8125 11.5 9.625 11.5H8.875C8.66406 11.5 8.5 11.6875 8.5 11.875ZM11.5 11.875V12.625C11.5 12.8359 11.6641 13 11.875 13L12.625 13C12.8125 13 13 12.8359 13 12.625V11.875C13 11.6875 12.8125 11.5 12.625 11.5L11.875 11.5C11.6641 11.5 11.5 11.6875 11.5 11.875ZM14.875 11.5C14.6641 11.5 14.5 11.6875 14.5 11.875V12.625C14.5 12.8359 14.6641 13 14.875 13H15.625C15.8125 13 16 12.8359 16 12.625V11.875C16 11.6875 15.8125 11.5 15.625 11.5H14.875ZM8.5 14.875V15.625C8.5 15.8359 8.66406 16 8.875 16H9.625C9.8125 16 10 15.8359 10 15.625V14.875C10 14.6875 9.8125 14.5 9.625 14.5H8.875C8.66406 14.5 8.5 14.6875 8.5 14.875ZM11.875 14.5C11.6641 14.5 11.5 14.6875 11.5 14.875V15.625C11.5 15.8359 11.6641 16 11.875 16H12.625C12.8125 16 13 15.8359 13 15.625V14.875C13 14.6875 12.8125 14.5 12.625 14.5L11.875 14.5ZM14.5 14.875V15.625C14.5 15.8359 14.6641 16 14.875 16H15.625C15.8125 16 16 15.8359 16 15.625V14.875C16 14.6875 15.8125 14.5 15.625 14.5H14.875C14.6641 14.5 14.5 14.6875 14.5 14.875Z" fill="#474543"/>
                      </svg>
                    </span>
                    Future events
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipFutureEvents}>
                    <button className="tooltip-info" aria-label="future events tooltip" aria-describedby="tooltipFutureEvents">?</button>
                  </OverlayTrigger>

                  {loadingLayers && loadingLayers.events &&
                    <Spinner animation="border" role="status" />
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <p className="filter-group__title">Conditions and features</p>
            <div className="filter-items-group">
              <div className="filter-items filter-items--conditions">
                <div className={'filter-item filter-item--highway-cameras' + (highwayCams ? ' checked' : '') + (disableFeatures ? ' disabled' : '') + ((loadingLayers && loadingLayers.cameras) ? ' loading' : '')}>
                  <input
                    type="checkbox"
                    name="highway cameras"
                    id="filter--highway-cameras"
                    onChange={e => filterHandler('highwayCams', e)}
                    defaultChecked={isCamDetail || mapContext.visible_layers.highwayCams}
                    disabled={isCamDetail || disableFeatures} />

                  <label className="filter-item__button" htmlFor="filter--highway-cameras">
                    <span className="filter-item__button__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9.75C6 9.06641 6.54687 8.5 7.25 8.5H12.25C12.9336 8.5 13.5 9.06641 13.5 9.75L13.5 14.75C13.5 15.4531 12.9336 16 12.25 16H7.25C6.54687 16 6 15.4531 6 14.75L6 9.75ZM16.918 9.20313C17.1133 9.32031 17.25 9.53516 17.25 9.75V14.75C17.25 14.9844 17.1133 15.1992 16.918 15.3164C16.7031 15.4141 16.4688 15.4141 16.2734 15.2773L14.3984 14.0273L14.125 13.8516V13.5V11V10.668L14.3984 10.4922L16.2734 9.24219C16.4688 9.10547 16.7031 9.10547 16.918 9.20313Z" fill="#053662"/>
                      </svg>
                    </span>
                    Highway cameras
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipHighwayCameras}>
                    <button className="tooltip-info" aria-label="highway cameras tooltip" aria-describedby="tooltipHighwayCameras">?</button>
                  </OverlayTrigger>

                  {loadingLayers && loadingLayers.cameras &&
                    <Spinner animation="border" role="status" />
                  }
                </div>

                <div className={'filter-item filter-item--road-conditions' + (roadConditions ? ' checked' : '') + ((disableFeatures && !enableRoadConditions) ? ' disabled' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                  <input
                    type="checkbox"
                    name="road conditions"
                    id="filter--road-conditions"
                    onChange={e => filterHandler('roadConditions', e)}
                    defaultChecked={mapContext.visible_layers.roadConditions}
                    disabled={(disableFeatures && !enableRoadConditions)}
                  />
                  <label className="filter-item__button" htmlFor="filter--road-conditions">
                    <span className="filter-item__button__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="m18.68 11.22-5.91-5.91c-.44-.41-1.12-.41-1.56 0l-5.9 5.91c-.41.44-.41 1.12 0 1.56l5.91 5.91c.44.41 1.12.41 1.56 0l5.91-5.91c.41-.44.41-1.12 0-1.56Zm-7.42 1.09L8.9 14.67a.46.46 0 0 1-.62 0l-2.36-2.36a.46.46 0 0 1 0-.62l2.36-2.36a.46.46 0 0 1 .62 0l2.36 2.36c.16.17.16.45 0 .62Zm6.84 0-2.36 2.36a.46.46 0 0 1-.62 0l-2.36-2.36a.46.46 0 0 1 0-.62l2.36-2.36a.46.46 0 0 1 .62 0l2.36 2.36c.16.17.16.45 0 .62Z" />
                      </svg>
                    </span>
                    Road conditions
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipRoadConditions}>
                    <button className="tooltip-info" aria-label="road conditions tooltip" aria-describedby="tooltipRoadConditions">?</button>
                  </OverlayTrigger>

                  {loadingLayers && loadingLayers.events &&
                    <Spinner animation="border" role="status" />
                  }
                </div>

                <div className={'filter-item filter-item--inland-ferries' + (inlandFerries ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                  <input
                    type="checkbox"
                    name="ferries"
                    id="filter--inland-ferries"
                    onChange={e => filterHandler('inlandFerries', e)}
                    defaultChecked={mapContext.visible_layers.inlandFerries}
                    disabled={disableFeatures}
                  />

                  <label className="filter-item__button" htmlFor="filter--inland-ferries">
                    <span className="filter-item__button__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.8125 6.375L13.5625 6.375C13.9277 6.375 14.25 6.69727 14.25 7.0625L15.8613 7.0625C16.291 7.0625 16.5273 7.59961 16.248 7.92188L15.7969 8.4375L8.57812 8.4375L8.10547 7.92188C7.82617 7.59961 8.0625 7.0625 8.49219 7.0625L10.125 7.0625C10.125 6.69727 10.4258 6.375 10.8125 6.375ZM8.0625 9.125L16.3125 9.125C16.6777 9.125 17 9.44727 17 9.8125V12.4766C17 12.7559 16.8926 13.0352 16.7422 13.2715L15.625 14.8184C15.582 14.8398 15.5605 14.8613 15.5176 14.9043C15.1738 15.1191 14.7871 15.291 14.4219 15.3125H14.0566C13.6914 15.291 13.3047 15.1191 12.9609 14.9043C12.4883 14.5605 11.8652 14.5605 11.3926 14.9043C11.0703 15.1191 10.6836 15.291 10.2969 15.3125H9.93164C9.56641 15.291 9.17969 15.1191 8.83594 14.9043C8.81445 14.8613 8.77148 14.8398 8.72852 14.8184L7.61133 13.2715C7.46094 13.0352 7.375 12.7559 7.375 12.4766L7.375 9.8125C7.375 9.44727 7.67578 9.125 8.0625 9.125ZM8.75 10.5V12.5625L15.625 12.5625V10.5L8.75 10.5ZM12.5742 15.4414C13.0684 15.7852 13.6484 16 14.25 16C14.8086 16 15.4316 15.7852 15.9043 15.4414C16.1621 15.2695 16.5059 15.291 16.7422 15.4844C17.0645 15.7422 17.4512 15.9355 17.8379 16.0215C18.2031 16.1074 18.4395 16.4727 18.3535 16.8594C18.2676 17.2246 17.8809 17.4609 17.5156 17.375C17 17.2461 16.5488 17.0098 16.2695 16.8379C15.6465 17.1602 14.959 17.375 14.25 17.375C13.5625 17.375 12.9395 17.1816 12.5098 16.9883C12.3809 16.9238 12.2734 16.8594 12.1875 16.8164C12.0801 16.8594 11.9727 16.9238 11.8437 16.9883C11.4141 17.1816 10.791 17.375 10.125 17.375C9.41602 17.375 8.70703 17.1602 8.08398 16.8379C7.80469 17.0098 7.35352 17.2461 6.83789 17.375C6.47266 17.4609 6.08594 17.2246 6 16.8594C5.91406 16.4941 6.15039 16.1074 6.51562 16.0215C6.90234 15.9355 7.31055 15.7422 7.61133 15.4844C7.84766 15.291 8.19141 15.2695 8.44922 15.4414C8.92187 15.7852 9.54492 16 10.125 16C10.7051 16 11.3066 15.7852 11.7793 15.4414C12.0156 15.2695 12.3379 15.2695 12.5742 15.4414Z" fill="#42814A"/>
                      </svg>
                    </span>
                    Ferries
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipFerries}>
                    <button className="tooltip-info" aria-label="ferries tooltip" aria-describedby="tooltipFerries">?</button>
                  </OverlayTrigger>
                </div>

                <div className={'filter-item filter-item--weather' + (weather ? ' checked' : '') + ((loadingLayers && loadingLayers.weathers) ? ' loading' : '') + (isDelaysPage ? ' disabled' : '')}>
                  <input
                    type="checkbox"
                    name="weather"
                    id="filter--weather"
                    onChange={e => filterHandler('weather', e)}
                    defaultChecked={mapContext.visible_layers.weather}
                    disabled={isDelaysPage} />

                  <label className="filter-item__button" htmlFor="filter--weather">
                    <span className="filter-item__button__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.4609 5.54688C13.5781 5.59375 13.6719 5.6875 13.6953 5.82813L14.1641 8.33594L16.6719 8.80469C16.8125 8.82813 16.9062 8.92188 16.9531 9.03906C17 9.15625 17 9.29688 16.9297 9.39063L16.4609 10.0703C16.2734 10.0234 16.0625 10 15.875 10C15.1016 10 14.3984 10.3516 13.9297 10.8672C13.625 9.53125 12.4297 8.5 11 8.5C9.33594 8.5 8 9.85938 8 11.5C8 13.1641 9.33594 14.5 11 14.5C11.2812 14.5 11.5625 14.4766 11.8203 14.3828C12.1016 15.2969 12.9219 15.9766 13.9062 16L13.6953 17.1953C13.6719 17.3359 13.5781 17.4297 13.4609 17.4766C13.3437 17.5234 13.2031 17.5234 13.1094 17.4531L11 15.9766L8.86719 17.4531C8.77344 17.5234 8.63281 17.5234 8.51562 17.4766C8.39844 17.4297 8.30469 17.3359 8.28125 17.1953L7.83594 14.6641L5.30469 14.2188C5.16406 14.1953 5.07031 14.1016 5.02344 13.9844C4.97656 13.8672 4.97656 13.7266 5.04687 13.6328L6.52344 11.5L5.04687 9.39062C4.97656 9.29688 4.97656 9.15625 5.02344 9.03906C5.07031 8.92188 5.16406 8.82812 5.30469 8.80469L7.83594 8.33594L8.28125 5.82812C8.30469 5.6875 8.39844 5.59375 8.51562 5.54688C8.63281 5.5 8.77344 5.5 8.86719 5.57031L11 7.04688L13.1094 5.57031C13.2031 5.5 13.3438 5.5 13.4609 5.54688ZM13.25 11.5C13.25 11.5469 13.2266 11.5938 13.2266 11.6406C12.4062 11.9453 11.7969 12.7188 11.75 13.6328C11.5156 13.7266 11.2578 13.75 10.9766 13.75C9.73437 13.75 8.72656 12.7422 8.72656 11.5C8.72656 10.2578 9.73438 9.25 10.9766 9.25C12.2188 9.25 13.2266 10.2578 13.2266 11.5H13.25ZM14 15.25C13.1562 15.25 12.5 14.5938 12.5 13.75C12.5 12.9297 13.1562 12.25 14 12.25H14.0234C14.2109 11.4063 14.9609 10.75 15.875 10.75C16.6953 10.75 17.375 11.2891 17.6328 12.0156C17.8438 11.9453 18.0547 11.875 18.3125 11.875C19.2266 11.875 20 12.6484 20 13.5625C20 14.5 19.2266 15.25 18.3125 15.25H14Z" fill="#474543"/>
                      </svg>
                    </span>
                    Weather
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipWeather}>
                    <button className="tooltip-info" aria-label="weather tooltip" aria-describedby="tooltipWeather">?</button>
                  </OverlayTrigger>

                  {loadingLayers && loadingLayers.weathers &&
                    <Spinner animation="border" role="status" />
                  }
                </div>

                <div className={'filter-item filter-item--wildfires disabled'}>
                  <input
                    type="checkbox"
                    name="wildfires"
                    id="filter--wildfires"
                    disabled={true} />

                  <label className="filter-item__button" htmlFor="filter--wildfires">
                    <span className="filter-item__button__icon">
                      <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.3906 5.47687L14.2111 5.7538C13.7175 6.3538 13.2688 6.53842 12.6406 6.53842C11.6085 6.53842 10.8008 5.70765 10.8008 4.59995V2.19995C10.8008 2.19995 4.47388 5.56918 4.47388 11.1218C4.47388 14.8737 7.52517 17.8 10.9355 17.8C14.6482 17.8 17.4867 14.7076 17.5315 11.2923C17.5613 9.03091 16.3982 6.64828 14.3906 5.47687ZM10.9803 16.4615C10.0563 16.4615 9.14058 15.7692 9.14058 14.6153C9.14058 13.9006 9.4496 13.5448 9.7688 13.2308L10.9803 11.9846L12.4162 13.4153C12.727 13.7294 12.8649 14.2461 12.8649 14.7538C12.8649 15.5384 12.1021 16.4615 10.9803 16.4615ZM14.0315 15.4923C14.0651 15.1867 14.4925 13.6674 13.3585 12.5384L10.9695 10.1846L8.64695 12.5384C7.50455 13.6759 7.89541 15.2036 7.92901 15.4923C7.43542 15.123 6.53799 14.1538 6.22388 13.323C5.92835 12.6643 5.73023 11.8452 5.73029 11.1218C5.73029 8.19995 8.15337 5.56918 9.49953 4.6461C9.49953 5.47687 9.91401 6.44468 10.5316 6.99995C11.1492 7.55522 11.8139 7.82948 12.6406 7.83072C13.2958 7.83072 13.9875 7.59572 14.5251 7.23072C15.6021 8.1538 16.2308 9.72043 16.2302 11.1076C16.2751 13.0923 15.1982 14.6615 14.0315 15.4923Z"/>
                      </svg>
                    </span>
                    Wildfires
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipWildfires}>
                    <button className="tooltip-info" aria-label="wildfires tooltip" aria-describedby="tooltipWildfires">?</button>
                  </OverlayTrigger>
                </div>

                <div className={'filter-item filter-item--rest-stops' + (restStops ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                  <input
                    type="checkbox"
                    name="rest stops"
                    id="filter--rest-stops"
                    onChange={e => filterHandler('restStops', e)}
                    defaultChecked={mapContext.visible_layers.restStops}
                    disabled={disableFeatures}
                  />
                  <label className="filter-item__button" htmlFor="filter--rest-stops">
                    <span className="filter-item__button__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.0625 8.4375C18.0625 8.56641 18.041 8.67383 18.0195 8.78125C18.4492 9.08203 18.75 9.59766 18.75 10.1563C18.75 11.123 17.9766 11.875 17.0312 11.875H16.6875V16.6875C16.6875 17.0742 16.3652 17.375 16 17.375C15.6133 17.375 15.3125 17.0742 15.3125 16.6875V11.875H14.9687C14.002 11.875 13.25 11.123 13.25 10.1562C13.25 9.59766 13.5293 9.08203 13.959 8.78125C13.9375 8.67383 13.9375 8.56641 13.9375 8.4375C13.9375 7.29883 14.8613 6.375 16 6.375C17.1387 6.375 18.0625 7.29883 18.0625 8.4375ZM5.6875 11.1875C5.6875 10.8223 5.98828 10.5 6.375 10.5H11.875C12.2402 10.5 12.5625 10.8223 12.5625 11.1875L12.5625 12.5625C12.5625 12.9492 12.2402 13.25 11.875 13.25L6.375 13.25C5.98828 13.25 5.6875 12.9492 5.6875 12.5625V11.1875ZM5.6875 13.9375L12.5625 13.9375C12.9277 13.9375 13.25 14.2598 13.25 14.625C13.25 15.0117 12.9277 15.3125 12.5625 15.3125V16.6875C12.5625 17.0742 12.2402 17.375 11.875 17.375C11.4883 17.375 11.1875 17.0742 11.1875 16.6875V15.3125L7.0625 15.3125V16.6875C7.0625 17.0742 6.74023 17.375 6.375 17.375C5.98828 17.375 5.6875 17.0742 5.6875 16.6875V15.3125C5.30078 15.3125 5 15.0117 5 14.625C5 14.2598 5.30078 13.9375 5.6875 13.9375Z" fill="#273F94"/>
                      </svg>
                    </span>
                    Rest stops
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipRestStops}>
                    <button className="tooltip-info" aria-label="rest stops tooltip" aria-describedby="tooltipRestStops">?</button>
                  </OverlayTrigger>
                </div>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <p className="filter-group__title">Commercial vehicles</p>
            <div className="filter-items-group">
              <div className="filter-items filter-items--conditions">
                <div className={'filter-item filter-item--chain-ups' + (chainUps ? ' checked' : '') + ((disableFeatures && !enableChainUps) ? ' disabled' : '') + ((loadingLayers && loadingLayers.events) ? ' loading' : '')}>
                  <input
                    type="checkbox"
                    name="chain ups"
                    id="filter--chain-ups"
                    onChange={e => filterHandler('chainUps', e)}
                    defaultChecked={mapContext.visible_layers.chainUps}
                    disabled={(disableFeatures && !enableChainUps)}
                  />
                  <label className="filter-item__button" htmlFor="filter--chain-ups">
                    <span className="filter-item__button__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.6 7H11.575C13.575 7 15.2 8.69271 15.175 10.776C15.175 12.625 13.9 14.1875 12.175 14.5H12.125C11.675 14.5781 11.275 14.2656 11.2 13.8229C11.125 13.3542 11.425 12.9375 11.85 12.8594H11.9C12.875 12.6771 13.6 11.7917 13.6 10.776C13.6 9.63021 12.675 8.66667 11.575 8.66667H7.6C6.5 8.66667 5.6 9.63021 5.6 10.776C5.6 11.7917 6.3 12.6771 7.275 12.8594H7.325C7.75 12.9375 8.05 13.3542 7.975 13.8229C7.9 14.2656 7.5 14.5781 7.05 14.5H7C5.275 14.1875 4 12.625 4 10.776C4 8.69271 5.6 7 7.6 7ZM16.375 17H12.4C10.4 17 8.8 15.3333 8.8 13.25C8.8 11.401 10.075 9.83854 11.825 9.52604H11.85C12.3 9.44792 12.7 9.76042 12.775 10.2031C12.85 10.6719 12.55 11.0885 12.125 11.1667H12.075C11.1 11.349 10.4 12.2083 10.4 13.25C10.4 14.3958 11.3 15.3333 12.4 15.3333H16.375C17.5 15.3333 18.4 14.3958 18.4 13.25C18.4 12.2083 17.675 11.349 16.7 11.1667H16.65C16.225 11.0885 15.925 10.6719 16 10.2031C16.075 9.76042 16.475 9.44792 16.925 9.52604H16.975C18.7 9.83854 20 11.401 20 13.25C20 15.3333 18.375 17 16.375 17Z" fill="#474543"/>
                    </svg>
                    </span>
                    Chain-ups in effect
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipChainUps}>
                    <button className="tooltip-info" aria-label="chain ups tooltip" aria-describedby="tooltipChainUps">?</button>
                  </OverlayTrigger>

                  {loadingLayers && loadingLayers.events &&
                    <Spinner animation="border" role="status" />
                  }
                </div>

                <div className={'filter-item filter-item--rest-stops-large-vehicle' + (largeRestStops ? ' checked' : '') + (disableFeatures ? ' disabled' : '')}>
                  <input
                    type="checkbox"
                    name="rest stops"
                    id="filter--rest-stops-large-vehicle"
                    onChange={e => filterHandler('largeRestStops', e)}
                    defaultChecked={mapContext.visible_layers.largeRestStops}
                    disabled={disableFeatures} />

                  <label className="filter-item__button" htmlFor="filter--rest-stops-large-vehicle">
                    <span className="filter-item__button__icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 9.42105C13 9.50986 12.9852 9.58388 12.9704 9.65789C13.2664 9.86513 13.4737 10.2204 13.4737 10.6053C13.4737 11.2714 12.9408 11.7895 12.2894 11.7895H12.0526V15.1052C12.0526 15.3717 11.8306 15.5789 11.5789 15.5789C11.3125 15.5789 11.1052 15.3717 11.1052 15.1052V11.7895H10.8684C10.2023 11.7895 9.68419 11.2714 9.68419 10.6053C9.68419 10.2204 9.87663 9.86513 10.1727 9.65789C10.1579 9.58388 10.1579 9.50986 10.1579 9.42105C10.1579 8.63651 10.7944 8 11.5789 8C12.3635 8 13 8.63651 13 9.42105ZM4.47368 11.3158C4.47368 11.0641 4.68092 10.8421 4.94737 10.8421H8.73683C8.98847 10.8421 9.21051 11.0641 9.21051 11.3158V12.2631C9.21051 12.5296 8.98847 12.7368 8.73683 12.7368H4.94737C4.68092 12.7368 4.47368 12.5296 4.47368 12.2631V11.3158ZM4.47368 13.2105H9.21051C9.46215 13.2105 9.68419 13.4325 9.68419 13.6842C9.68419 13.9506 9.46215 14.1579 9.21051 14.1579V15.1052C9.21051 15.3717 8.98847 15.5789 8.73683 15.5789C8.47038 15.5789 8.26314 15.3717 8.26314 15.1052V14.1579H5.42105V15.1052C5.42105 15.3717 5.19901 15.5789 4.94737 15.5789C4.68092 15.5789 4.47368 15.3717 4.47368 15.1052V14.1579C4.20724 14.1579 4 13.9506 4 13.6842C4 13.4325 4.20724 13.2105 4.47368 13.2105Z" fill="#273F94"/>
                        <path d="M13.7896 9.60511C13.7896 8.95379 14.2501 8.4209 14.8422 8.4209H19.4737C20.0527 8.4209 20.5264 8.95379 20.5264 9.60511V13.8683C20.5264 14.2679 20.3553 14.6084 20.1053 14.8156V15.5261C20.1053 15.7926 19.908 15.9998 19.6843 15.9998H19.2632C19.0264 15.9998 18.8422 15.7926 18.8422 15.5261V15.0525H15.4738V15.5261C15.4738 15.7926 15.2764 15.9998 15.0527 15.9998H14.6317C14.3948 15.9998 14.2106 15.7926 14.2106 15.5261V14.8156C13.9474 14.6084 13.7896 14.2679 13.7896 13.8683V9.60511ZM15.4869 10.6857L15.2632 11.7367H19.0527L18.8159 10.6857C18.7632 10.4637 18.5922 10.3156 18.408 10.3156H15.908C15.7106 10.3156 15.5395 10.4637 15.5001 10.6857H15.4869ZM15.4738 13.1577C15.4738 12.9061 15.2764 12.684 15.0527 12.684C14.8159 12.684 14.6317 12.9061 14.6317 13.1577C14.6317 13.4242 14.8159 13.6314 15.0527 13.6314C15.2764 13.6314 15.4738 13.4242 15.4738 13.1577ZM19.2632 13.6314C19.4869 13.6314 19.6843 13.4242 19.6843 13.1577C19.6843 12.9061 19.4869 12.684 19.2632 12.684C19.0264 12.684 18.8422 12.9061 18.8422 13.1577C18.8422 13.4242 19.0264 13.6314 19.2632 13.6314Z" fill="#273F94"/>
                      </svg>
                    </span>
                    Rest stops
                  </label>

                  <OverlayTrigger placement="top" overlay={tooltipRestStopsCommercialVehicles}>
                    <button className="tooltip-info" aria-label="rest stops" aria-describedby="tooltipRestStopsCommercialVehicles">?</button>
                  </OverlayTrigger>
                </div>
                <div className="filter-item filter-item--seasonal-load">
                  <FontAwesomeIcon icon={faTruckContainer} />
                  <a className="seasonal-load-link" href="https://www.th.gov.bc.ca/bchighways/loadrestrictions/loadrestrictions.htm" rel="noopener noreferrer" alt="Seasonal load restrictions">Seasonal load restrictions</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  );
}
