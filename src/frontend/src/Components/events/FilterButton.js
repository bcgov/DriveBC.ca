// React
import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';

// Redux
import { memoize } from 'proxy-memoize';
import { useSelector } from 'react-redux';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faXmark,
  faCircleQuestion,
  faTruckContainer
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Spinner from 'react-bootstrap/Spinner';
import Tooltip from 'react-bootstrap/Tooltip';

// Internal imports
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
    enableChainUps,
    textOverride,
    isCamDetail,
    referenceData,
    loadingLayers,
    isDelaysPage
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
  const [closures, setClosures] = useState(eventCategory && eventCategory == 'closures' ? true : mapContext.visible_layers.closures);
  const [majorEvents, setMajorEvents] = useState(eventCategory && eventCategory == 'majorEvents' ? true : mapContext.visible_layers.majorEvents);
  const [minorEvents, setMinorEvents] = useState(eventCategory && eventCategory == 'minorEvents' ? true : mapContext.visible_layers.minorEvents);
  const [futureEvents, setFutureEvents] = useState(eventCategory && eventCategory == 'futureEvents' ? true : mapContext.visible_layers.futureEvents);
  const [roadConditions, setRoadConditions] = useState(mapContext.visible_layers.roadConditions);
  const [chainUps, setChainUps] = useState(mapContext.visible_layers.chainUps);
  const [highwayCams, setHighwayCams] = useState(isCamDetail ? isCamDetail : mapContext.visible_layers.highwayCams);
  const [inlandFerries, setInlandFerries] = useState(mapContext.visible_layers.inlandFerries);
  const [weather, setWeather] = useState(mapContext.visible_layers.weather);
  const [restStops, setRestStops] = useState(mapContext.visible_layers.restStops);
  const [largeRestStops, setLargeRestStops] = useState(mapContext.visible_layers.largeRestStops);

  // Effects
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (searchedRoutes && !!searchedRoutes.length) {
      if (!closures) filterHandler('closures');
      if (!majorEvents) filterHandler('majorEvents');
      if (!minorEvents) filterHandler('minorEvents');
      if (!futureEvents) filterHandler('futureEvents');
      if (!roadConditions) filterHandler('roadConditions');
      if (!inlandFerries) filterHandler('inlandFerries');
    }
  }, [searchedRoutes]);

  // Helpers
  const setLayerVisibility = (layer, checked, runCallback=true) => {
    if (mapLayers && mapLayers.current[layer]) {
      // Set visible in map only
      mapLayers.current[layer].setVisible(checked);
    }

    // Run callback for event list, non-line layers
    if (callback && runCallback) {
      callback(layer, checked);
    }

    // Set context and local storage
    mapContext.visible_layers[layer] = checked;
    setMapContext(mapContext);
    localStorage.setItem('mapContext', JSON.stringify(mapContext));
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
    if(type2 === 'largeRestStop') {
      referenceData.type = "largeRestStop";
    } else {
      referenceData.type = "restStop";
    }
  }

  // Handlers
  const filterHandler = (layer, e) => {
    switch (layer) {
      case 'closures':
        trackEvent('click', 'map', 'Toggle closures layer');
        setLayerVisibility('closures', !closures);
        setLayerVisibility('closuresLines', !closures, false);
        setClosures(!closures);
        break;
      case 'majorEvents':
        trackEvent('click', 'map', 'Toggle major events layer');
        setLayerVisibility('majorEvents', !majorEvents);
        setLayerVisibility('majorEventsLines', !majorEvents, false);
        setMajorEvents(!majorEvents);
        break;
      case 'minorEvents':
        trackEvent('click', 'map', 'Toggle minor events layer');
        setLayerVisibility('minorEvents', !minorEvents);
        setLayerVisibility('minorEventsLines', !minorEvents, false);
        setMinorEvents(!minorEvents);
        break;
      case 'futureEvents':
        trackEvent('click', 'map', 'Toggle future events layer');
        setLayerVisibility('futureEvents', !futureEvents);
        setLayerVisibility('futureEventsLines', !futureEvents, false);
        setFutureEvents(!futureEvents);
        break;
      case 'roadConditions':
        trackEvent('click', 'map', 'Toggle road conditions layer');
        setLayerVisibility('roadConditions', !roadConditions);
        setLayerVisibility('roadConditionsLines', !roadConditions, false);
        setRoadConditions(!roadConditions);
        break;
      case 'chainUps':
        trackEvent('click', 'map', 'Toggle chain ups layer')
        setLayerVisibility('chainUps', !chainUps);
        setLayerVisibility('chainUpsLines', !chainUps, false);
        setChainUps(!chainUps);
        break;
      case 'highwayCams':
        trackEvent('click', 'map', 'Toggle highway cameras layer');
        setLayerVisibility('highwayCams', !highwayCams);
        setHighwayCams(!highwayCams);
        break;
      case 'inlandFerries':
        trackEvent('click', 'map', 'Toggle inland ferries layer');
        setLayerVisibility('inlandFerries', !inlandFerries);
        setInlandFerries(!inlandFerries);
        break;
      case 'weather':
        trackEvent('click', 'map', 'Toggle weather layer')
        setLayerVisibility('weather', !weather);
        setLayerVisibility('regional', !weather);
        setLayerVisibility('hef', !weather);
        setWeather(!weather);
        break;
      case 'restStops':
        trackEvent('click', 'map', 'Toggle rest stops layer')
        if (!restStops && largeRestStops) {
          setLayerVisibility('largeRestStops', false);
          setLargeRestStops(false);
        }
        setLayerVisibility('restStops', !restStops);
        setRestStops(!restStops);
        updateUrl("largeRestStop", "restStop");
        break;
      case 'largeRestStops':
        trackEvent('click', 'map', 'Toggle rest stops layer')
        if (restStops && !largeRestStops) {
          setLayerVisibility('restStops', false);
          setRestStops(false);
        }
        setLayerVisibility('largeRestStops', !largeRestStops);
        setLargeRestStops(!largeRestStops);
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

  const tooltipInlandFerries = (
    <Tooltip id="tooltipInlandFerries" className="tooltip-content">
      <p>Travel requires the use of an inland ferry.</p>
    </Tooltip>
  );
  const tooltipWeather  = (
    <Tooltip id="tooltipWeather" className="tooltip-content">
      <p>Weather updates for roads.</p>
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
    <div className="filters-btn">
      <Button
        variant={isDelaysPage ? 'outline-primary' : 'primary'}
        className={'map-btn open-filters' + (open ? ' open' : '')}
        aria-label="open filters options"
        onClick={() => {
          open ? setOpen(false) : setOpen(true) }
        }>
        <span className="filters-btn__text">{textOverride ? textOverride : 'Map Layers'}</span>

        <FontAwesomeIcon icon={faFilter} />
      </Button>
    </div>
  );
}
