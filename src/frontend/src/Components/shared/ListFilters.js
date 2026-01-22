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
                          <circle cx="12" cy="12" r="8" fill="#ce3e39"/>
                          <rect x="7" y="11" width="10" height="3" rx="1" fill="#fff"/>
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
                          <path d="M10 5.5c.398 0 .75.352.75.75V7h3v-.75c0-.398.328-.75.75-.75.398 0 .75.352.75.75V7h1.125c.61 0 1.125.516 1.125 1.125V9.25H7V8.125C7 7.515 7.492 7 8.125 7H9.25v-.75c0-.398.328-.75.75-.75M7 10h10.5v6.375c0 .633-.516 1.125-1.125 1.125h-8.25A1.11 1.11 0 0 1 7 16.375zm1.5 1.875v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375h-.75a.385.385 0 0 0-.375.375m3 0v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375h-.75a.385.385 0 0 0-.375.375m3.375-.375a.385.385 0 0 0-.375.375v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375zM8.5 14.875v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375h-.75a.385.385 0 0 0-.375.375m3.375-.375a.385.385 0 0 0-.375.375v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375zm2.625.375v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375h-.75a.385.385 0 0 0-.375.375" fill="#474543"/>
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
                          <path d="M6 9.75c0-.684.547-1.25 1.25-1.25h5c.684 0 1.25.566 1.25 1.25v5c0 .703-.566 1.25-1.25 1.25h-5C6.547 16 6 15.453 6 14.75zm10.918-.547a.67.67 0 0 1 .332.547v5c0 .234-.137.45-.332.566-.215.098-.45.098-.645-.039l-1.875-1.25-.273-.175v-3.184l.273-.176 1.875-1.25c.196-.137.43-.137.645-.039" fill="#053662"/>
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
                          <path d="M10.813 6.375h2.75c.365 0 .687.322.687.688h1.611c.43 0 .666.537.387.859l-.451.516H8.578l-.473-.516c-.279-.322-.043-.86.387-.86h1.633c0-.365.3-.687.688-.687m-2.75 2.75h8.25c.365 0 .687.322.687.688v2.664c0 .279-.107.558-.258.794l-1.117 1.547a.4.4 0 0 0-.107.086c-.344.215-.73.387-1.096.409h-.365c-.366-.022-.752-.194-1.096-.409a1.32 1.32 0 0 0-1.568 0c-.323.215-.71.387-1.096.409h-.365c-.366-.022-.752-.194-1.096-.409-.022-.043-.065-.064-.107-.086L7.61 13.272a1.5 1.5 0 0 1-.236-.795V9.812c0-.365.3-.687.688-.687M8.75 10.5v2.063h6.875V10.5zm3.824 4.941c.494.344 1.074.559 1.676.559.559 0 1.182-.215 1.654-.559a.71.71 0 0 1 .838.043c.322.258.71.451 1.096.537a.697.697 0 0 1 .515.838.71.71 0 0 1-.837.516 4.6 4.6 0 0 1-1.246-.537c-.623.322-1.311.537-2.02.537-.687 0-1.31-.193-1.74-.387-.13-.064-.237-.129-.322-.172-.108.043-.215.108-.344.172a4.3 4.3 0 0 1-1.719.387c-.709 0-1.418-.215-2.041-.537-.28.172-.73.408-1.246.537A.71.71 0 0 1 6 16.859a.707.707 0 0 1 .516-.838 2.6 2.6 0 0 0 1.095-.537.71.71 0 0 1 .838-.043 2.96 2.96 0 0 0 1.676.559c.58 0 1.182-.215 1.654-.559a.68.68 0 0 1 .795 0" fill="#42814a"/>
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
                          <path d="M13.46 5.547a.36.36 0 0 1 .235.281l.47 2.508 2.507.469c.14.023.234.117.281.234s.047.258-.023.352l-.47.68a2.5 2.5 0 0 0-.585-.071c-.773 0-1.477.352-1.945.867C13.625 9.531 12.43 8.5 11 8.5c-1.664 0-3 1.36-3 3 0 1.664 1.336 3 3 3 .281 0 .563-.023.82-.117.282.914 1.102 1.594 2.086 1.617l-.21 1.195a.36.36 0 0 1-.235.282c-.117.046-.258.046-.352-.024L11 15.977l-2.133 1.476c-.094.07-.234.07-.351.024a.36.36 0 0 1-.235-.282l-.445-2.53-2.531-.446a.36.36 0 0 1-.282-.235c-.046-.117-.046-.257.024-.351L6.523 11.5 5.047 9.39c-.07-.093-.07-.234-.024-.35a.36.36 0 0 1 .282-.235l2.53-.47.446-2.507a.36.36 0 0 1 .235-.281c.117-.047.257-.047.351.023L11 7.047l2.11-1.477c.093-.07.234-.07.35-.023m-.21 5.953c0 .047-.023.094-.023.14a2.27 2.27 0 0 0-1.477 1.993c-.234.094-.492.117-.773.117a2.25 2.25 0 1 1 2.25-2.25zm.75 3.75a1.48 1.48 0 0 1-1.5-1.5c0-.82.656-1.5 1.5-1.5h.023a1.91 1.91 0 0 1 1.852-1.5c.82 0 1.5.54 1.758 1.266.21-.07.422-.141.68-.141A1.71 1.71 0 0 1 20 13.563c0 .937-.773 1.687-1.687 1.687z" fill="#474543"/>
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
                          <path d="m14.39 5.477-.179.277c-.494.6-.942.784-1.57.784-1.033 0-1.84-.83-1.84-1.938V2.2s-6.327 3.37-6.327 8.922c0 3.752 3.051 6.678 6.461 6.678 3.713 0 6.552-3.092 6.597-6.508.03-2.261-1.134-4.644-3.141-5.815m-3.41 10.985c-.924 0-1.84-.693-1.84-1.847 0-.714.31-1.07.629-1.384l1.211-1.246 1.436 1.43c.311.314.449.831.449 1.339 0 .784-.763 1.708-1.885 1.708m3.051-.97c.034-.305.461-1.825-.673-2.954l-2.389-2.353-2.322 2.353c-1.142 1.138-.752 2.666-.718 2.954-.494-.369-1.391-1.338-1.705-2.169-.296-.659-.494-1.478-.494-2.201 0-2.922 2.423-5.553 3.77-6.476 0 .83.414 1.799 1.032 2.354.617.555 1.282.83 2.109.83.655 0 1.347-.234 1.884-.6 1.077.924 1.706 2.49 1.705 3.878.045 1.984-1.032 3.553-2.199 4.384"/>
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
                          <path d="M18.063 8.438c0 .128-.022.236-.043.343.43.301.73.817.73 1.375a1.71 1.71 0 0 1-1.719 1.719h-.343v4.813a.69.69 0 0 1-.688.687.68.68 0 0 1-.687-.687v-4.813h-.344a1.697 1.697 0 0 1-1.719-1.719c0-.558.28-1.074.709-1.375-.021-.107-.021-.215-.021-.344a2.063 2.063 0 0 1 4.124 0m-12.375 2.75c0-.366.3-.688.687-.688h5.5c.365 0 .688.322.688.688v1.374a.69.69 0 0 1-.688.688h-5.5a.68.68 0 0 1-.687-.687zm0 2.75h6.875c.365 0 .687.322.687.687a.69.69 0 0 1-.687.688v1.374a.69.69 0 0 1-.688.688.68.68 0 0 1-.687-.687v-1.375H7.062v1.374a.69.69 0 0 1-.687.688.68.68 0 0 1-.687-.687v-1.375A.68.68 0 0 1 5 14.625c0-.365.3-.687.688-.687" fill="#273f94"/>
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
                        <path d="M7.6 7h3.975c2 0 3.625 1.693 3.6 3.776 0 1.849-1.275 3.412-3 3.724h-.05c-.45.078-.85-.234-.925-.677-.075-.469.225-.886.65-.964h.05c.975-.182 1.7-1.067 1.7-2.083 0-1.146-.925-2.11-2.025-2.11H7.6c-1.1 0-2 .964-2 2.11 0 1.016.7 1.901 1.675 2.083h.05c.425.079.725.495.65.964-.075.443-.475.755-.925.677H7c-1.725-.312-3-1.875-3-3.724C4 8.693 5.6 7 7.6 7m8.775 10H12.4c-2 0-3.6-1.667-3.6-3.75 0-1.849 1.275-3.411 3.025-3.724h.025c.45-.078.85.234.925.677.075.469-.225.886-.65.964h-.05c-.975.182-1.675 1.041-1.675 2.083 0 1.146.9 2.083 2 2.083h3.975c1.125 0 2.025-.937 2.025-2.083a2.1 2.1 0 0 0-1.7-2.083h-.05c-.425-.079-.725-.495-.65-.964.075-.443.475-.755.925-.677h.05C18.7 9.839 20 11.401 20 13.25c0 2.083-1.625 3.75-3.625 3.75" fill="#474543"/>
                      </svg>
                      </span>
                      Chain-ups
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
                          <path d="M13 9.421c0 .089-.015.163-.03.237.296.207.504.562.504.947a1.18 1.18 0 0 1-1.185 1.185h-.236v3.315a.477.477 0 0 1-.474.474.47.47 0 0 1-.474-.474V11.79h-.237a1.17 1.17 0 0 1-1.184-1.185c0-.385.193-.74.489-.947-.015-.074-.015-.148-.015-.237a1.421 1.421 0 0 1 2.842 0m-8.526 1.895c0-.252.207-.474.473-.474h3.79c.251 0 .474.222.474.474v.947a.477.477 0 0 1-.474.474h-3.79a.47.47 0 0 1-.473-.474zm0 1.894H9.21c.251 0 .473.222.473.474a.477.477 0 0 1-.473.474v.947a.477.477 0 0 1-.474.474.47.47 0 0 1-.474-.474v-.947H5.421v.947a.477.477 0 0 1-.474.474.47.47 0 0 1-.473-.474v-.947A.47.47 0 0 1 4 13.684c0-.252.207-.473.474-.473m9.316-3.606c0-.651.46-1.184 1.052-1.184h4.632c.579 0 1.052.533 1.052 1.184v4.263c0 .4-.17.74-.42.948v.71c0 .267-.198.474-.422.474h-.42c-.238 0-.422-.207-.422-.474v-.473h-3.368v.473c0 .267-.198.474-.421.474h-.421c-.237 0-.421-.207-.421-.474v-.71c-.264-.208-.421-.548-.421-.948zm1.697 1.08-.224 1.052h3.79l-.237-1.051c-.053-.222-.224-.37-.408-.37h-2.5c-.197 0-.368.148-.408.37zm-.013 2.473c0-.252-.198-.474-.421-.474-.237 0-.421.222-.421.474 0 .266.184.473.42.473.224 0 .422-.207.422-.473m3.79.473c.223 0 .42-.207.42-.473 0-.252-.197-.474-.42-.474-.238 0-.422.222-.422.474 0 .266.184.473.421.473" fill="#273f94"/>
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
                        <circle cx="12" cy="12" r="8" fill="#ce3e39"/>
                        <rect x="7" y="11" width="10" height="3" rx="1" fill="#fff"/>
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
                        <path d="M10 5.5c.398 0 .75.352.75.75V7h3v-.75c0-.398.328-.75.75-.75.398 0 .75.352.75.75V7h1.125c.61 0 1.125.516 1.125 1.125V9.25H7V8.125C7 7.515 7.492 7 8.125 7H9.25v-.75c0-.398.328-.75.75-.75M7 10h10.5v6.375c0 .633-.516 1.125-1.125 1.125h-8.25A1.11 1.11 0 0 1 7 16.375zm1.5 1.875v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375h-.75a.385.385 0 0 0-.375.375m3 0v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375h-.75a.385.385 0 0 0-.375.375m3.375-.375a.385.385 0 0 0-.375.375v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375zM8.5 14.875v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375h-.75a.385.385 0 0 0-.375.375m3.375-.375a.385.385 0 0 0-.375.375v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375zm2.625.375v.75c0 .21.164.375.375.375h.75a.385.385 0 0 0 .375-.375v-.75a.4.4 0 0 0-.375-.375h-.75a.385.385 0 0 0-.375.375" fill="#474543"/>
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
                        <path d="M6 9.75c0-.684.547-1.25 1.25-1.25h5c.684 0 1.25.566 1.25 1.25v5c0 .703-.566 1.25-1.25 1.25h-5C6.547 16 6 15.453 6 14.75zm10.918-.547a.67.67 0 0 1 .332.547v5c0 .234-.137.45-.332.566-.215.098-.45.098-.645-.039l-1.875-1.25-.273-.175v-3.184l.273-.176 1.875-1.25c.196-.137.43-.137.645-.039" fill="#053662"/>
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
                        <path d="M10.813 6.375h2.75c.365 0 .687.322.687.688h1.611c.43 0 .666.537.387.859l-.451.516H8.578l-.473-.516c-.279-.322-.043-.86.387-.86h1.633c0-.365.3-.687.688-.687m-2.75 2.75h8.25c.365 0 .687.322.687.688v2.664c0 .279-.107.558-.258.794l-1.117 1.547a.4.4 0 0 0-.107.086c-.344.215-.73.387-1.096.409h-.365c-.366-.022-.752-.194-1.096-.409a1.32 1.32 0 0 0-1.568 0c-.323.215-.71.387-1.096.409h-.365c-.366-.022-.752-.194-1.096-.409-.022-.043-.065-.064-.107-.086L7.61 13.272a1.5 1.5 0 0 1-.236-.795V9.812c0-.365.3-.687.688-.687M8.75 10.5v2.063h6.875V10.5zm3.824 4.941c.494.344 1.074.559 1.676.559.559 0 1.182-.215 1.654-.559a.71.71 0 0 1 .838.043c.322.258.71.451 1.096.537a.697.697 0 0 1 .515.838.71.71 0 0 1-.837.516 4.6 4.6 0 0 1-1.246-.537c-.623.322-1.311.537-2.02.537-.687 0-1.31-.193-1.74-.387-.13-.064-.237-.129-.322-.172-.108.043-.215.108-.344.172a4.3 4.3 0 0 1-1.719.387c-.709 0-1.418-.215-2.041-.537-.28.172-.73.408-1.246.537A.71.71 0 0 1 6 16.859a.707.707 0 0 1 .516-.838 2.6 2.6 0 0 0 1.095-.537.71.71 0 0 1 .838-.043 2.96 2.96 0 0 0 1.676.559c.58 0 1.182-.215 1.654-.559a.68.68 0 0 1 .795 0" fill="#42814a"/>
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
                        <path d="M13.46 5.547a.36.36 0 0 1 .235.281l.47 2.508 2.507.469c.14.023.234.117.281.234s.047.258-.023.352l-.47.68a2.5 2.5 0 0 0-.585-.071c-.773 0-1.477.352-1.945.867C13.625 9.531 12.43 8.5 11 8.5c-1.664 0-3 1.36-3 3 0 1.664 1.336 3 3 3 .281 0 .563-.023.82-.117.282.914 1.102 1.594 2.086 1.617l-.21 1.195a.36.36 0 0 1-.235.282c-.117.046-.258.046-.352-.024L11 15.977l-2.133 1.476c-.094.07-.234.07-.351.024a.36.36 0 0 1-.235-.282l-.445-2.53-2.531-.446a.36.36 0 0 1-.282-.235c-.046-.117-.046-.257.024-.351L6.523 11.5 5.047 9.39c-.07-.093-.07-.234-.024-.35a.36.36 0 0 1 .282-.235l2.53-.47.446-2.507a.36.36 0 0 1 .235-.281c.117-.047.257-.047.351.023L11 7.047l2.11-1.477c.093-.07.234-.07.35-.023m-.21 5.953c0 .047-.023.094-.023.14a2.27 2.27 0 0 0-1.477 1.993c-.234.094-.492.117-.773.117a2.25 2.25 0 1 1 2.25-2.25zm.75 3.75a1.48 1.48 0 0 1-1.5-1.5c0-.82.656-1.5 1.5-1.5h.023a1.91 1.91 0 0 1 1.852-1.5c.82 0 1.5.54 1.758 1.266.21-.07.422-.141.68-.141A1.71 1.71 0 0 1 20 13.563c0 .937-.773 1.687-1.687 1.687z" fill="#474543"/>
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
                        <path d="m14.39 5.477-.179.277c-.494.6-.942.784-1.57.784-1.033 0-1.84-.83-1.84-1.938V2.2s-6.327 3.37-6.327 8.922c0 3.752 3.051 6.678 6.461 6.678 3.713 0 6.552-3.092 6.597-6.508.03-2.261-1.134-4.644-3.141-5.815m-3.41 10.985c-.924 0-1.84-.693-1.84-1.847 0-.714.31-1.07.629-1.384l1.211-1.246 1.436 1.43c.311.314.449.831.449 1.339 0 .784-.763 1.708-1.885 1.708m3.051-.97c.034-.305.461-1.825-.673-2.954l-2.389-2.353-2.322 2.353c-1.142 1.138-.752 2.666-.718 2.954-.494-.369-1.391-1.338-1.705-2.169-.296-.659-.494-1.478-.494-2.201 0-2.922 2.423-5.553 3.77-6.476 0 .83.414 1.799 1.032 2.354.617.555 1.282.83 2.109.83.655 0 1.347-.234 1.884-.6 1.077.924 1.706 2.49 1.705 3.878.045 1.984-1.032 3.553-2.199 4.384"/>
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
                        <path d="M18.063 8.438c0 .128-.022.236-.043.343.43.301.73.817.73 1.375a1.71 1.71 0 0 1-1.719 1.719h-.343v4.813a.69.69 0 0 1-.688.687.68.68 0 0 1-.687-.687v-4.813h-.344a1.697 1.697 0 0 1-1.719-1.719c0-.558.28-1.074.709-1.375-.021-.107-.021-.215-.021-.344a2.063 2.063 0 0 1 4.124 0m-12.375 2.75c0-.366.3-.688.687-.688h5.5c.365 0 .688.322.688.688v1.374a.69.69 0 0 1-.688.688h-5.5a.68.68 0 0 1-.687-.687zm0 2.75h6.875c.365 0 .687.322.687.687a.69.69 0 0 1-.687.688v1.374a.69.69 0 0 1-.688.688.68.68 0 0 1-.687-.687v-1.375H7.062v1.374a.69.69 0 0 1-.687.688.68.68 0 0 1-.687-.687v-1.375A.68.68 0 0 1 5 14.625c0-.365.3-.687.688-.687" fill="#273f94"/>
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
                    Chain-ups
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
