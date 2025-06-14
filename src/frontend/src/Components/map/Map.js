/* eslint-disable no-unused-vars */
// React
import React, {
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// Redux
import * as slices from '../../slices';
import { updateSearchLocationFromWithMyLocation, updateSelectedRoute } from "../../slices";
import { memoize } from 'proxy-memoize';
import { useSelector, useDispatch } from 'react-redux';

// External imports
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Spinner from 'react-bootstrap/Spinner';
import {
  faChevronUp,
  faChevronDown,
  faPlus,
  faMinus,
  faUpRightAndDownLeftFromCenter,
  faLocationCrosshairs,
  faXmark,
  faArrowLeft
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';

// Internal imports
import { addCameraGroups } from '../data/webcams.js';
import { compareRoutes } from "../data/routes";
import {
  blueLocationMarkup,
  redLocationToMarkup,
  onMoveEnd,
  setLocationPin,
  setZoomPan,
  toggleMyLocation,
  zoomIn,
  zoomOut,
  fitMap,
  removeOverlays
} from './helpers';
import { loadLayer, loadEventsLayers, updateEventsLayers, enableReferencedLayer } from './layers';
import { FeatureContext, MapContext } from '../../App.js';
import { resizePanel, renderPanel, togglePanel } from './panels';
import { pointerMoveHandler, resetHoveredStates } from './handlers/hover';
import { pointerClickHandler, resetClickedStates } from './handlers/click';
import CurrentCameraIcon from '../cameras/CurrentCameraIcon';
import DistanceLabels from "../routing/DistanceLabels";
import Filters from '../shared/Filters.js';
import FilterTabs from './filter/FilterTabs';
import RouteSearch from '../routing/RouteSearch.js';
import NetworkErrorPopup from './errors/NetworkError';
import ServerErrorPopup from './errors/ServerError';
import StaleLinkErrorPopup from './errors/StaleLinkError';
import LocationAccessPopup from './errors/LocationAccessError';
import overrides from '../map/overrides.js';

// Map & geospatial imports
import { applyStyle } from 'ol-mapbox-style';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { ScaleLine } from 'ol/control.js';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import Geolocation from 'ol/Geolocation.js';
import MVT from 'ol/format/MVT.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View';

// Styling
import './Map.scss';
import { cameraStyles, routeStyles } from "../data/featureStyleDefinitions";

export default function DriveBCMap(props) {
  /* initialization */
  // Misc
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Props
  const {
    mapProps: {referenceData, isCamDetail, mapViewRoute, loadCamDetails},
    showNetworkError, showServerError, trackedEventsRef,
    loadingLayers, setLoadingLayers, getInitialLoadingLayers
  } = props;

  // Navigation
  const [searchParams, setSearchParams] = useSearchParams();

  let mousePointXClicked = undefined;

  // Context
  const { mapContext } = useContext(MapContext);
  const { featureContext, setFeatureContext } = useContext(FeatureContext);

  // Redux
  const dispatch = useDispatch();
  const {
    feeds: {
      cameras: { list: cameras, filteredList: filteredCameras },
      events: { list: events, filteredList: filteredEvents },
      ferries: { list: ferries, filteredList: filteredFerries },
      weather: { list: currentWeather, filteredList: filteredCurrentWeathers },
      regional: { list: regionalWeather, filteredList: filteredRegionalWeathers },
      hef: { list: hef, filteredList: filteredHef },
      restStops: { list: restStops, filteredList: filteredRestStops },
      borderCrossings: { list: borderCrossings, filteredList: filteredBorderCrossings },
    },
    advisories: { list: advisories, filteredList: filteredAdvisories },
    routes: { searchLocationFrom, searchLocationTo, selectedRoute, searchedRoutes },
    map: { zoom, pan }

  } = useSelector(
    useCallback(
      memoize(state => ({
        feeds: {
          cameras: state.feeds.cameras,
          events: state.feeds.events,
          ferries: state.feeds.ferries,
          weather: state.feeds.weather,
          regional: state.feeds.regional,
          hef: state.feeds.hef,
          restStops: state.feeds.restStops,
          borderCrossings: state.feeds.borderCrossings,
        },
        advisories: state.cms.advisories,
        routes: state.routes,
        map: state.map
      })),
    ),
  );

  // Refs
  const mapLayers = useRef({}); window.mapLayers = mapLayers;
  const geolocation = useRef();
  const hoveredFeature = useRef();
  const isInitialMountLocation = useRef();
  const isInitialClickedFeature = useRef();
  const searchParamInitialized = useRef();
  const locationPinRef = useRef();
  const locationToPinRef = useRef();
  const mapElement = useRef();
  const mapRef = useRef();
  const mapView = useRef();
  const panel = useRef();
  const myLocationRef = useRef();
  const locationSet = useRef();
  const routingContainerRef = useRef();
  const cameraLocationButtonRef = useRef();
  const scaleLineRef = useRef();

  // States
  const [openTabs, setOpenTabs] = useState(largeScreen && !isCamDetail);
  const [maximizedPanel, setMaximizedPanel] = useState(false);
  const [myLocationLoading, setMyLocationLoading] = useState(false);
  const [myLocation, setMyLocation] = useState();
  const [advisoriesInView, setAdvisoriesInView] = useState([]);
  const [referenceFeature, updateReferenceFeature] = useState();
  const [selectedFerries, setSelectedFerries] = useState();
  const [routeDetails, setRouteDetails] = useState({
    distance: null,
    distanceUnit: null,
    closures: null,
    majorEvents: null,
    minorEvents: null,
    roadConditions: null,
    chainUps: null,
    advisories: null
  });
  const [showSpinner, setShowSpinner] = useState(false);
  const [showRouteObjs, setShowRouteObjs] = useState(false);

  // Workaround for OL handlers not being able to read states
  const [clickedFeature, setClickedFeature] = useState();
  const [staleLinkMessage, setStaleLinkMessage] = useState();
  const clickedFeatureRef = useRef();
  const updateClickedFeature = feature => {
    // Remove highlight from feature on click
    if (feature && feature instanceof Feature && feature.get('highlight')) {
      // Remove highlight from feature
      feature.set("highlight", false)

      // Remove highlight from tracked event
      const trackedEvent = trackedEventsRef.current[feature.get('id')];
      if (trackedEvent)
        trackedEvent.highlight = false;
    }

    clickedFeatureRef.current = feature;
    setClickedFeature(feature);
    updatePosition(feature);
  };

  // ScaleLine
  const scaleLineControl = new ScaleLine({ units: 'metric' });
  const updateScaleLineClass = (open) => {
    if (!scaleLineRef.current) {
      scaleLineRef.current = scaleLineControl.element;
    }

    if (open) {
      scaleLineRef.current.classList.add('tabs-pushed');

    } else {
      scaleLineRef.current.classList.remove('tabs-pushed');
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (referenceFeature && isCamDetail) {
        referenceFeature.set('clicked', true);
        if (clickedFeature !== undefined) {
          referenceFeature.setStyle(cameraStyles.active);
          updateClickedFeature(referenceFeature);
          clearInterval(interval);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [referenceFeature]);

  useEffect(() => {
    if (!isInitialClickedFeature.current) {
      isInitialClickedFeature.current = true;
      return;
    }

    const featureType = clickedFeature instanceof Feature ? clickedFeature.get('type') : null;

    if (featureType === 'route' && !compareRoutes(clickedFeature.get('route'), selectedRoute)) {
      for (const route of searchedRoutes) {
        if (compareRoutes(route === clickedFeature.get('route'))) {
          dispatch(updateSelectedRoute(route));
        }
      }
    }
  }, [clickedFeature])

  const updatePosition = (feature) => {
    // Do not process empty features, routes and advisories
    if (feature != null && !Array.isArray(feature) && feature.get('type') !== 'route'&& feature.get('type') !== 'advisory') {
      let geometry = feature.getGeometry();

      if (geometry.getType() !== 'Point') { // feature is a line or polygon
        geometry = feature.getProperties().altFeature.getGeometry(); // use the point feature's geometry
      }

      if (mousePointXClicked < 390) {
        setZoomPan(mapView, mapView.current.getZoom(), geometry.flatCoordinates);
      }
    }
  };

  const [showLocationAccessError, setShowLocationAccessError] = useState(false);

  // check if geolocation permission is granted
  navigator.permissions
  .query({ name: "geolocation" })
  .then((permissionStatus) => {
    permissionStatus.onchange = () => {
      if(permissionStatus.state === 'denied') {
        setShowLocationAccessError(true);
      }
      else {
        setShowLocationAccessError(false);
      }
    };
  });

  const loadMyLocation = () => {
    if (!locationSet.current) {
      setMyLocationLoading(true)
    } else {
      dispatch(updateSearchLocationFromWithMyLocation([locationSet.current]));
    }
  }

  useEffect(() => {
    if(myLocationLoading) {
      toggleMyLocation(mapRef, mapView, setMyLocationLoading, setMyLocation);
    }
  }, [myLocationLoading])

  useEffect(() => {
    if(myLocation) {
      locationSet.current = myLocation;
      dispatch(updateSearchLocationFromWithMyLocation([myLocation]));
    }
  }, [myLocation])

  /* useEffect hooks */
  /* Push ScaleLine to the left when tabs are open */
  useEffect(() => {
    updateScaleLineClass(openTabs);
  }, [openTabs]);

  /* initialization for OpenLayers map */
  useEffect(() => {
    if (mapRef.current) return; // stops map from initializing more than once

    // Enable referenced layer
    enableReferencedLayer(referenceData, mapContext);

    const tileSource = new VectorTileSource({
      format: new MVT(),
      url: window.BASE_MAP,
    });

    // base tile map layer
    const vectorLayer = new VectorTileLayer({
      declutter: true,
      source: tileSource,
      style: function(feature, resolution) { return null; }, // avoids displaying blueline default style before style loads
    });

    // highway symbol layer
    const symbolLayer = new VectorTileLayer({
      declutter: true,
      source: tileSource,
      style: function(feature, resolution) { return null; }, // avoids displaying blueline default style before style loads
    });
    // should be highest z-index so that highway symbols are always visible
    symbolLayer.setZIndex(200);

    // initialize starting optional mapLayers
    window.layers = mapLayers;

    // Set map extent (W, S, E, N)
    const extent = [-155.230138, 36.180153, -102.977437, 66.591323];
    const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

    mapView.current = new View({
      projection: 'EPSG:3857',
      center: fromLonLat(pan),
      zoom: (isCamDetail || (referenceData && referenceData.type)) ? 5 : zoom,
      maxZoom: 15,
      minZoom: 5,
      extent: transformedExtent,
      enableRotation: false
    });

    // Apply the basemap style from the arcgis resource
    fetch(window.MAP_STYLE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(function (response) {
      response.json().then(function (glStyle) {
        // DBC22-2153
        glStyle.metadata['ol:webfonts'] = '/fonts/{font-family}/{fontweight}{-fontstyle}.css';

        // Overrides
        for (const layer of glStyle.layers) {
          overrides.merge(layer, overrides[layer.id] || {});
        }

        // clone the basemap style so we can override the style layers,
        // filtering out everything that isn't a highway symbol.
        const symbolsStyle = {
          ...glStyle,
          layers: glStyle.layers.filter((layer) => (
            layer.id.startsWith('TRANSPORTATION/DRA/Hwy Symbols') ||
            layer.id.startsWith('TRANSPORTATION/DRA/Road Names')

          )),
        };

        applyStyle(vectorLayer, glStyle, 'esri');
        applyStyle(symbolLayer, symbolsStyle, 'esri');
      });
    });

    // create map
    mapRef.current = new Map({
      target: mapElement.current,
      layers: [vectorLayer, symbolLayer],
      view: mapView.current,
      moveTolerance: 7,
      controls: [scaleLineControl],
    });

    geolocation.current = new Geolocation({
      projection: mapView.current.getProjection(),
    });

    mapRef.current.on('moveend', function () {
      if (smallScreen) {
        resetHoveredStates(null, hoveredFeature);
      }

      dispatch(
        slices.updateMapState({
          pan: toLonLat(mapView.current.getCenter()),
          zoom: mapView.current.getZoom(),
        }),
      );
    });

    // Event listeners
    mapRef.current.on('click', async e => {
      const features = mapRef.current.getFeaturesAtPixel(e.pixel, {
        hitTolerance: 20,
      });

      const mousePointX = e.pixel[0];
      mousePointXClicked = mousePointX;

      pointerClickHandler(
        features, clickedFeatureRef, updateClickedFeature,
        mapView, isCamDetail, loadCamDetails, updateReferenceFeature,
        updateRouteDisplay, mapContext
      );
    });

    // Hover states
    mapRef.current.on('pointermove', (e) => {
      pointerMoveHandler(e, mapRef, hoveredFeature);
    });
  });

  /* Map operations on location search */
  useEffect(() => {
    if (searchLocationFrom && searchLocationFrom.length) {
      if (locationPinRef.current) {
        mapRef.current.removeOverlay(locationPinRef.current);
      }

      setLocationPin(
        searchLocationFrom[0].geometry.coordinates,
        blueLocationMarkup,
        mapRef,
        locationPinRef,
        'Location From',
      );

      if (isInitialMountLocation.current === null) {
        // first run of this effector
        // store the initial searchLocationFrom.[0].label so that subsequent
        // runs can be evaluated to detect change in the search from
        isInitialMountLocation.current = searchLocationFrom[0].label;

      // only zoomPan on from location change when to location is NOT set
      } else if (
        isInitialMountLocation.current !== searchLocationFrom[0].label &&
        searchLocationTo.length == 0
      ) {
        isInitialMountLocation.current = false;
        setZoomPan(
          mapView,
          9,
          fromLonLat(searchLocationFrom[0].geometry.coordinates),
        );
      }

    } else {
      // initial location was set, so no need to prevent pan/zoom
      isInitialMountLocation.current = false;
      if (locationPinRef.current) {
        mapRef.current.removeOverlay(locationPinRef.current);
      }
    }
  }, [searchLocationFrom]);

  useEffect(() => {
    if (searchLocationTo && searchLocationTo.length) {
      if (locationToPinRef.current) {
        mapRef.current.removeOverlay(locationToPinRef.current);
      }

      setLocationPin(
        searchLocationTo[0].geometry.coordinates,
        redLocationToMarkup,
        mapRef,
        locationToPinRef,
        'Location To',
      );

      const locationToPin = document.querySelectorAll(".ol-selectable")[0];
      if(locationToPin !== undefined){
        locationToPin.classList.remove("ol-overlay-container");
      }
    } else {
      isInitialMountLocation.current = false;
      if (locationToPinRef.current) {
        mapRef.current.removeOverlay(locationToPinRef.current);
      }
    }
  }, [searchLocationTo]);

  /* Triggering handlers based on navigation data */
  useEffect(() => {
    if (referenceFeature) {
      setZoomPan(mapView, 9, referenceFeature.getGeometry().flatCoordinates);

      pointerClickHandler(
        [referenceFeature], clickedFeatureRef, updateClickedFeature,
        mapView, isCamDetail, loadCamDetails, updateReferenceFeature,
        updateRouteDisplay, mapContext
      );
    }
  }, [referenceFeature]);

  /* Loading map layers */
  // Route layer
  const updateRouteDisplay = (route) => {
    if (!route || !mapLayers.current.routeLayer) {
      return;
    }

    const routeFeatures = mapLayers.current.routeLayer.getSource().getFeatures();
    for (const feature of routeFeatures) {
      if (compareRoutes(feature.get('route'), route)) {
        feature.set('clicked', true);
        feature.setStyle(routeStyles['active']);
        dispatch(updateSelectedRoute(route));

      } else {
        feature.set('clicked', false);
        feature.setStyle(routeStyles['static']);
      }
    }
  }

  useEffect(() => {
    setLoadingLayers(getInitialLoadingLayers());

    // Mark all features as invisible
    Object.values(mapLayers.current).forEach(layer => {
      layer.getSource().getFeatures().forEach(feature => {
        feature.setStyle(null);
      });
    });

    // Use only selectedRoute in cam details page
    const routesData = isCamDetail ? (selectedRoute ? [selectedRoute] : null) : searchedRoutes;
    loadLayer(
      mapLayers, mapRef, mapContext,
      'routeLayer', routesData, routesData, 6, selectedRoute, updateReferenceFeature
    );

    if (localStorage.getItem("pendingFit") === 'true') {
      fitMap(searchedRoutes, mapView);
    }

    // Remove all overlays from previously searched routes
    if (!searchedRoutes || !searchedRoutes.length) {
      removeOverlays(mapRef);
    }
  }, [searchedRoutes]);

  // Cameras layer
  useEffect(() => {
    // Do nothing if list empty
    if (filteredCameras) {
      // Deep clone and add group reference to each cam
      const clonedCameras = structuredClone(cameras);
      const groupedCameras = addCameraGroups(clonedCameras);
      const clonedFilteredCameras = structuredClone(filteredCameras);
      const groupedFilteredCameras = addCameraGroups(clonedFilteredCameras);

      loadLayer(
        mapLayers, mapRef, mapContext,
        'highwayCams', groupedCameras, groupedFilteredCameras, 63,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredCameras]);


  // Simulate camera location clicked on details page
  useEffect(() => {
    const interval = setInterval(() => {
      if (isCamDetail && cameraLocationButtonRef.current) {
        cameraLocationButtonRef.current.click();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  // Events layer
  useEffect(() => {
    // Add layers if not loaded
    if (events && mapLayers.current && !mapLayers.current['majorEvents']) {
      const eventFound = loadEventsLayers(events, mapContext, mapLayers, mapRef, referenceData, updateReferenceFeature, setLoadingLayers);
      if (referenceData?.type === 'event' && !eventFound) {
        setStaleLinkMessage(true);
        setSearchParams({});
      }
    }

    // Count filtered events to store in routeDetails
    if (filteredEvents) {
      // Toggle features visibility
      const featuresDict = updateEventsLayers(filteredEvents, mapLayers, setLoadingLayers, referenceData);
      setFeatureContext({...featureContext, events: featuresDict});

      const eventCounts = {
        closures: 0,
        majorEvents: 0,
        minorEvents: 0,
        roadConditions: 0,
        chainUps: 0,
      }
      filteredEvents.forEach(event => {
        const eventType = event.display_category;
        if (eventType && Object.hasOwn(routeDetails, eventType)) {
          eventCounts[eventType] += 1;
          setRouteDetails({ ...routeDetails, ...eventCounts});
        }
      });
    }

  }, [filteredEvents]);

  // Ferries layer
  useEffect(() => {
    if (!isCamDetail && ferries && filteredFerries) {
      const featuresDict = loadLayer(
        mapLayers, mapRef, mapContext,
        'inlandFerries', ferries, filteredFerries, 66,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
      setFeatureContext({...featureContext, ferries: featuresDict});
    }

    // Add ferry count to routeDetails
    if (Array.isArray(filteredFerries)) {
      setSelectedFerries(filteredFerries.length);
    }
  }, [filteredFerries]);

  // Current weathers layer
  useEffect(() => {
    if (!isCamDetail) {
      loadLayer(
        mapLayers, mapRef, mapContext,
        'weather', currentWeather, filteredCurrentWeathers, 68,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredCurrentWeathers]);

  // Regional weathers layer
  useEffect(() => {
    if (!isCamDetail) {
      loadLayer(
        mapLayers, mapRef, mapContext,
        'regional', regionalWeather, filteredRegionalWeathers, 69,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredRegionalWeathers]);

  // High elevation forecasts layer
  useEffect(() => {
    if (!isCamDetail) {
      loadLayer(
        mapLayers, mapRef, mapContext,
        'hef', hef, filteredHef, 70,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredHef]);

  // Rest stops layer
  useEffect(() => {
    if (!isCamDetail) {
      loadLayer(
        mapLayers, mapRef, mapContext,
        'restStops', restStops, filteredRestStops, 60,
        referenceData, updateReferenceFeature, setLoadingLayers
      );

      loadLayer(
        mapLayers, mapRef, mapContext,
        'largeRestStops', restStops, filteredRestStops, 60,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredRestStops]);

  // Border crossings layer
  useEffect(() => {
    if (!isCamDetail) {
      loadLayer(
        mapLayers, mapRef, mapContext,
        'borderCrossings', borderCrossings, filteredBorderCrossings, 71,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [borderCrossings]);

  // Advisories layer
  useEffect(() => {
    const featuresDict = loadLayer(
      mapLayers, mapRef, mapContext,
      'advisoriesLayer', advisories, filteredAdvisories, 5
    );

    setFeatureContext({...featureContext, advisories: featuresDict});
  }, [advisories]);

  useEffect(() => {
    const advisoriesData = (filteredAdvisories && filteredAdvisories.length) ? filteredAdvisories : [];

    if (mapRef.current) {
      // First filter
      onMoveEnd(mapRef.current, advisoriesData, setAdvisoriesInView);

      // Set handler for filtering on map move
      mapRef.current.on('moveend', (e) => onMoveEnd(e.map, advisoriesData, setAdvisoriesInView));
    }
  }, [filteredAdvisories]);

  /* Constants for conditional rendering */
  // Disable cam panel in details page
  const disablePanel = isCamDetail && clickedFeature && clickedFeature.get('type') === 'camera';
  const openPanel =
    (!!clickedFeature ||
      (searchedRoutes && searchedRoutes.length && !isCamDetail)
    ) && !disablePanel;
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  // Reset search params when panel is closed
  useEffect(() => {
    if (searchParamInitialized.current) {
      if (!clickedFeature) {
        setSearchParams(new URLSearchParams({}));
      }

    } else {
      searchParamInitialized.current = true;
    }

    if (selectedRoute && clickedFeature && clickedFeature.get('type') !== 'route') {
      setShowRouteObjs(true);
    }
  }, [clickedFeature]);

  useEffect(() => {
    if (!selectedRoute) {
      setShowRouteObjs(false);
    }
  }, [selectedRoute]);

  /* Rendering */
  return (
    <div className={`map-container ${isCamDetail ? 'preview' : ''}`}>
      {smallScreen && openTabs &&
        <div className='mobile-mask'></div>
      }

      {searchedRoutes &&
        <DistanceLabels updateRouteDisplay={updateRouteDisplay} mapRef={mapRef} isCamDetail={isCamDetail} />
      }

      {!!openPanel &&
        <div
          ref={panel}
          className={`side-panel ${openPanel ? 'open' : ''} ${selectedRoute ? 'has-route' : ''}`}>

          {clickedFeature && !isCamDetail && smallScreen &&
            <button
              className={`resize-panel + ${selectedRoute ? '' : ' no-route'}`}
              aria-label={`${(maximizedPanel ? 'minimize' : 'maximize') + ' side panel'}`}
              tabIndex={0}
              onClick={() => resizePanel(panel, clickedFeature, setMaximizedPanel)}
              onTouchMove={() => resizePanel(panel, clickedFeature, setMaximizedPanel)}
              onKeyDown={keyEvent => {
                if (keyEvent.keyCode == 13) {
                  resizePanel(panel, clickedFeature);
                }
              }}>
              <FontAwesomeIcon icon={maximizedPanel ? faChevronDown : faChevronUp} />
            </button>
          }

          {clickedFeature && (!selectedRoute || isCamDetail) &&
            <button
              className="close-panel"
              aria-label={`${openPanel ? 'close side panel' : ''}`}
              aria-hidden={`${openPanel ? false : true}`}
              tabIndex={`${openPanel ? 0 : -1}`}
              onClick={(e) => {
                e.stopPropagation();
                togglePanel(panel, resetClickedStates, clickedFeatureRef, updateClickedFeature, [
                  myLocationRef, routingContainerRef
                ], searchedRoutes);
                setMaximizedPanel(false);
              }}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          }

          {clickedFeature && selectedRoute && !isCamDetail &&
            <Button
              variant="primary-outline"
              className="btn-outline-primary back-to-details"
              aria-label={`back to route details`}
              tabIndex={`${openPanel ? 0 : -1}`}
              onKeyPress={(e) => {
                e.stopPropagation();
                togglePanel(panel, resetClickedStates, clickedFeatureRef, updateClickedFeature, [
                  myLocationRef, routingContainerRef
                ], searchedRoutes);
                setMaximizedPanel(false);
              }}
              onClick={(e) => {
                e.stopPropagation();
                togglePanel(panel, resetClickedStates, clickedFeatureRef, updateClickedFeature, [
                  myLocationRef, routingContainerRef
                ], searchedRoutes);
                setMaximizedPanel(false);
              }}>

              <FontAwesomeIcon icon={faArrowLeft}/>
              Route details
            </Button>
          }

          <div className="panel-content">
            {renderPanel(
              clickedFeature && !clickedFeature.get ? advisoriesInView : clickedFeature,
              isCamDetail,
              smallScreen,
              mapView,
              clickedFeatureRef,
              updateClickedFeature,
              showRouteObjs,
              setShowRouteObjs
            )}
          </div>
        </div>
      }

      <div ref={mapElement} className="map">
        {!isCamDetail && !smallScreen && (
          <div className={`map-left-container ${(showServerError || showNetworkError) ? 'error-showing' : ''} ${openPanel && 'margin-pushed'}`}>
            <RouteSearch
              ref={routingContainerRef}
              routeEdit={true}
              showSpinner={showSpinner}
              onShowSpinnerChange={setShowSpinner}
              myLocation={myLocation}
              mapRef={mapRef}
              mapView={mapView}
              resetClickedStates={() => resetClickedStates(null, clickedFeatureRef, updateClickedFeature)} />
          </div>
        )}

        {(!isCamDetail && smallScreen && !maximizedPanel) && (
          <React.Fragment>
            <Button
              ref={myLocationRef}
              className="map-btn my-location"
              variant="primary"
              onClick={loadMyLocation}
              aria-label="my location">
              { myLocationLoading
                ? <Spinner animation="border" role="status" />
                : <FontAwesomeIcon icon={faLocationCrosshairs} />
              }
              My location
            </Button>

            <FilterTabs
              mapLayers={mapLayers}
              disableFeatures={isCamDetail}
              enableRoadConditions={true}
              enableChainUps={true}
              isCamDetail={isCamDetail}
              referenceData={referenceData}
              loadingLayers={loadingLayers}
              open={openTabs}
              setOpen={setOpenTabs} />
          </React.Fragment>
        )}

        {(!isCamDetail && !smallScreen) && (
          <React.Fragment>
            <FilterTabs
              mapLayers={mapLayers}
              disableFeatures={isCamDetail}
              enableRoadConditions={true}
              enableChainUps={true}
              isCamDetail={isCamDetail}
              referenceData={referenceData}
              loadingLayers={loadingLayers}
              open={openTabs}
              setOpen={setOpenTabs} />

            <Button
              ref={myLocationRef}
              className={`map-btn my-location ${openPanel && 'margin-pushed'}`}
              variant="primary"
              onClick={loadMyLocation}
              aria-label="my location">
                {(myLocationLoading) ? <Spinner animation="border" role="status" /> : <FontAwesomeIcon icon={faLocationCrosshairs} />}
              My location
            </Button>
          </React.Fragment>
        )}

        <div className={"map-btn zoom-btn" + (openTabs ? ' tabs-pushed' : '')}>
          <Button
            className="zoom-in"
            variant="primary"
            aria-label="zoom in"
            onClick={() => zoomIn(mapView)}>
            <FontAwesomeIcon icon={faPlus} />
          </Button>

          <Button
            className="zoom-out"
            variant="primary"
            onClick={() => zoomOut(mapView)}
            aria-label="zoom out">
            <FontAwesomeIcon icon={faMinus} />
          </Button>

          <div className="zoom-divider" />
        </div>
      </div>

      {isCamDetail && (
        <Button
          ref={cameraLocationButtonRef}
          className="map-btn cam-location"
          variant="primary"
          onClick={() => {
            if (referenceData) {
              setZoomPan(mapView, 9, fromLonLat(referenceData.location.coordinates));
            }

            if (referenceFeature) {
              referenceFeature.set('clicked', true);
              referenceFeature.setStyle(cameraStyles.active);
              updateClickedFeature(referenceFeature);
            }
          }}>
          <CurrentCameraIcon />
          Camera location
        </Button>
      )}

      {isCamDetail && (
        <Button
          className="map-btn map-view"
          variant="primary"
          onClick={mapViewRoute}>
          <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
          Map view
        </Button>
      )}

      {isCamDetail && (
        <Filters
          mapLayers={mapLayers}
          disableFeatures={isCamDetail}
          enableRoadConditions={true}
          enableChainUps={true}
          textOverride={'Map Layers'}
          isCamDetail={isCamDetail}
          referenceData={referenceData}
          loadingLayers={loadingLayers} />
      )}

      {showLocationAccessError &&
        <LocationAccessPopup />
      }

      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup />
      }

      {staleLinkMessage && <StaleLinkErrorPopup message={staleLinkMessage}/> }
    </div>
  );
}
