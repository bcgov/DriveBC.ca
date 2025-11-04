/* eslint-disable no-unused-vars, no-prototype-builtins */

// React
import React, {
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';

// Navigation
import { useNavigate, useSearchParams } from 'react-router-dom';

// Redux
import * as slices from '../../slices';
import { updateSearchLocationFromWithMyLocation, updateSelectedRoute, updateShowRouteObjs } from "../../slices";
import { memoize } from 'proxy-memoize';
import { useSelector, useDispatch } from 'react-redux';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronUp,
  faChevronDown,
  faPlus,
  faMinus,
  faUpRightAndDownLeftFromCenter,
  faLocationCrosshairs,
  faXmark,
  faArrowLeft,
  faMap
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';
import Button from 'react-bootstrap/Button';
import cloneDeep from 'lodash/cloneDeep';
import Spinner from 'react-bootstrap/Spinner';
import { Drawer } from '@vladyoslav/drawer';

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
import { layerNameMap, toggleableLayers } from "./enums";
import { loadLayer, loadEventsLayers, updateEventsLayers, enableReferencedLayer } from './layers';
import { FeatureContext, MapContext } from '../../App.js';
import { resizePanel, renderPanel, togglePanel } from './panels';
import { pointerMoveHandler, resetHoveredStates } from './handlers/hover';
import { pointerClickHandler, resetClickedStates } from './handlers/click';
import { updateOverlappingPositions } from "./layers/eventsLayer";
import CurrentCameraIcon from '../cameras/CurrentCameraIcon';
import DistanceLabels from "../routing/DistanceLabels";
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
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');

  // Props
  const {
    mapProps: {referenceData, rootCamera, isCamDetail, mapViewRoute, loadCamDetails},
    showNetworkError, showServerError, trackedEventsRef,
    loadingLayers, setLoadingLayers, getInitialLoadingLayers
  } = props;

  // Navigation
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  let mousePointXClicked = undefined;

  // Context
  const { mapContext, setMapContext } = useContext(MapContext);
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
      wildfires: { list: wildfires, filteredList: filteredWildfires },
    },
    advisories: { list: advisories, filteredList: filteredAdvisories },
    routes: { searchLocationFrom, searchLocationTo, selectedRoute, searchedRoutes, showRouteObjs },
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
          wildfires: state.feeds.wildfires,
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

  // Initialization flags
  const isInitialMountLocation = useRef();
  const isInitialClickedFeature = useRef();
  const referenceFeatureInitialized = useRef(false);

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

  const handleSetShowRouteObjs = (value) => {
    dispatch(updateShowRouteObjs(value));
  };

  /* Constants for conditional rendering */
  // Disable cam panel in details page
  const disablePanel = isCamDetail && clickedFeature && clickedFeature.get('type') === 'camera';
  const openPanel =
    (!!clickedFeature ||
      (searchedRoutes && searchedRoutes.length && !isCamDetail)
    ) && !disablePanel;

  // Drawer state
  const getSnapPoints = () => {
    if (!isCamDetail && showRouteObjs && selectedRoute) {
      return !smallScreen ? ['25%', '50%', '80%'] : ['25%', '50%', '90%'];
    } else {
      return !smallScreen ? ['25%', '50%', '80%'] : ['25%', '50%', '100%'];
    }
  };

  // Use a ref to persist the snap point across renders
  const snapPointRef = useRef('25%');
  const [snap, setSnap] = useState('25%');

  // Update both state and ref when snap changes
  const handleSnapChange = useCallback((newSnap) => {
    snapPointRef.current = newSnap;
    setSnap(newSnap);
  }, []);

  const snapPoints = getSnapPoints();

  // Update snap when route details are shown/hidden (only when snap points actually change)
  const prevRouteDetailsActive = useRef(false);
  const prevSnapPoints = useRef(snapPoints);
  const routeDetailsActive = !isCamDetail && showRouteObjs && selectedRoute;

  useEffect(() => {
    // Only adjust snap if the available snap points have changed
    const snapPointsChanged = JSON.stringify(prevSnapPoints.current) !== JSON.stringify(snapPoints);
    
    if (snapPointsChanged) {
      // Check if current snap point is valid in new snap points array
      if (!snapPoints.includes(snapPointRef.current)) {
        // Current snap isn't valid, adjust to nearest valid snap
        const currentSnapValue = parseInt(snapPointRef.current);
        const closestSnap = snapPoints.reduce((prev, curr) => {
          return Math.abs(parseInt(curr) - currentSnapValue) < Math.abs(parseInt(prev) - currentSnapValue) ? curr : prev;
        });
        handleSnapChange(closestSnap);
      }
      
      prevSnapPoints.current = snapPoints;
    }
    
    prevRouteDetailsActive.current = routeDetailsActive;
  }, [snapPoints, routeDetailsActive, handleSnapChange]);

  // When opening a new feature, maintain the last used snap point
  useEffect(() => {
    if (openPanel && !largeScreen) {
      // Use the stored snap point reference
      setSnap(snapPointRef.current);
    } else if (!openPanel) {
      // Reset to default when drawer is completely dismissed
      snapPointRef.current = '25%';
      setSnap('25%');
    }
  }, [openPanel, largeScreen]);

  // Track drawer y-position to reposition buttons fixed to draggable mobile panel
  const drawerRef = useRef();
  const [drawerY, setDrawerY] = useState(0);
  const drawerInitialOffset = useRef(null);

  useEffect(() => {
    let frame;
    
    const updatePosition = () => {
      if (drawerRef.current) {
        const transform = getComputedStyle(drawerRef.current).transform;
        if (transform && transform !== 'none') {
          const match = transform.match(/matrix.*\((.+)\)/);
          if (match) {
            const values = match[1].split(', ');
            const translateY = parseFloat(values[5]);
            
            // Capture the initial offset on first read
            if (drawerInitialOffset.current === null) {
              drawerInitialOffset.current = translateY;
            }
            
            // Calculate relative movement from initial position
            const relativeY = translateY - drawerInitialOffset.current;
            
            // Add offset for navbar when route is selected
            // -58px when route objects are shown, -37px when just route is selected
            const routeDetailsOffset = selectedRoute ? (showRouteObjs ? -58 : 20) : 0;
            setDrawerY(relativeY + routeDetailsOffset);
          }
        } else {
          setDrawerY(0);
        }
      } else {
        setDrawerY(0);
        drawerInitialOffset.current = null; // Reset when drawer unmounts
      }
      frame = requestAnimationFrame(updatePosition);
    };

    frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [showRouteObjs, selectedRoute]);

  // ScaleLine
  const scaleLineControl = new ScaleLine({ units: 'metric' });
  const updateScaleLineClass = (openTabs, showRouteObjs) => {
    if (!scaleLineRef.current) {
      scaleLineRef.current = scaleLineControl.element;
    }

    const el = scaleLineRef.current;
    el.classList.toggle('tabs-pushed', !!openTabs);
    el.classList.toggle('route-details-open', (showRouteObjs && !clickedFeature));
  }

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

  const loadMyLocation = () => {
    if (!locationSet.current) {
      setMyLocationLoading(true);
    } else {
      dispatch(updateSearchLocationFromWithMyLocation([locationSet.current]));
    }
  }

  useEffect(() => {
    if(myLocationLoading) {
      toggleMyLocation(mapRef, mapView, setMyLocationLoading, setMyLocation, setShowLocationAccessError);
    }
  }, [myLocationLoading])

  useEffect(() => {
    if(myLocation) {
      locationSet.current = myLocation;
      dispatch(updateSearchLocationFromWithMyLocation([myLocation]));
    }
  }, [myLocation])

  // DBC22-4575: re-implementing DBC22-3835
  useEffect(() => {
    if (!clickedFeature) return;

    // Fetch layer status
    const featureType = clickedFeature.get('type');
    const layerName = featureType == 'event' ?
      clickedFeature.get('display_category') :
      layerNameMap[featureType];
    const layerActive = mapContext.visible_layers[layerName];

    // If layer is off, close panel
    if (!layerActive) resetClickedStates(null, clickedFeatureRef, updateClickedFeature);

  }, toggleableLayers.map(layer => mapContext.visible_layers[layer]));

  /* useEffect hooks */
  /* Push ScaleLine to the left when tabs are open */
  useEffect(() => {
    updateScaleLineClass(openTabs, showRouteObjs);
  }, [openTabs, showRouteObjs]);

  /* initialization for OpenLayers map */
  useEffect(() => {
    if (mapRef.current) return; // stops map from initializing more than once

    // check if geolocation permission is granted
    if (!isCamDetail && navigator.permissions) {  // only when permissions API is supported
      navigator.permissions.query({ name: "geolocation" }).then((permissionStatus) => {
        setShowLocationAccessError(permissionStatus.state === 'denied');
      });
    }

    // Enable referenced layer
    enableReferencedLayer(referenceData, mapContext);

    // Enable highway cams layer if in cam detail
    if (isCamDetail) {
      mapContext.visible_layers['highwayCams'] = true;
    }

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

    // Initialize map view
    // Center
    const sharedPan = searchParams.get('pan');
    const initialCenter = sharedPan ? sharedPan.split(",").map(Number) : pan;

    // Zoom
    const defaultZoom = isCamDetail ? 5 : zoom;
    const sharedZoom = searchParams.get('zoom');
    const initialZoom = sharedZoom ? sharedZoom : defaultZoom;

    mapView.current = new View({
      projection: 'EPSG:3857',
      center: fromLonLat(initialCenter),
      zoom: initialZoom,
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

      const [lon, lat] = toLonLat(mapView.current.getCenter());

      const params = new URLSearchParams(window.location.search);

      // Zoom/resolution changed, update overlapping event positions
      if (params.get('zoom') != mapView.current.getZoom()) {
        updateOverlappingPositions(mapLayers, mapContext, mapView);
      }

      params.set("pan", lon + ',' + lat);
      params.set("zoom", mapView.current.getZoom());
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });

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
  }, []);

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
        if (mapContext.pendingStartPan) {
          setZoomPan(
            mapView,
            null,
            fromLonLat(searchLocationFrom[0].geometry.coordinates),
          );

          setMapContext({
            ...mapContext,
            pendingStartPan: false,
          })
        }
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
    if (referenceFeature && !referenceFeatureInitialized.current) {
      pointerClickHandler(
        [referenceFeature], clickedFeatureRef, updateClickedFeature,
        mapView, isCamDetail, loadCamDetails, updateReferenceFeature,
        updateRouteDisplay, mapContext
      );

      referenceFeatureInitialized.current = true;
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
      const clonedCameras = typeof structuredClone === 'function' ? structuredClone(cameras) : cloneDeep(cameras);
      const groupedCameras = addCameraGroups(clonedCameras);
      const clonedFilteredCameras = typeof structuredClone === 'function' ? structuredClone(filteredCameras) : cloneDeep(filteredCameras);
      const groupedFilteredCameras = addCameraGroups(clonedFilteredCameras);

      loadLayer(
        mapLayers, mapRef, mapContext,
        'highwayCams', groupedCameras, groupedFilteredCameras, 63,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredCameras]);

  // Events layer
  useEffect(() => {
    // Add layers if not loaded
    if (events && mapLayers.current && !mapLayers.current['majorEvents']) {
      const eventFound = loadEventsLayers(events, mapContext, mapLayers, mapRef, referenceData, updateReferenceFeature, setLoadingLayers);
      if (referenceData?.type === 'event' && !eventFound) {
        setStaleLinkMessage(true);
        searchParams.delete('type');
        searchParams.delete('display_category');
        searchParams.delete('id');
        setSearchParams(searchParams, { replace: true });
      }
    }

    // Count filtered events to store in routeDetails
    if (filteredEvents) {
      // Toggle features visibility
      const featuresDict = updateEventsLayers(mapContext, filteredEvents, mapLayers, setLoadingLayers, referenceData, mapView);
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
        if (eventType) {
          const hasOwn = Object.hasOwn ?
            Object.hasOwn(routeDetails, eventType) :
            routeDetails.hasOwnProperty(eventType);

          if (hasOwn) {
            eventCounts[eventType] += 1;
            setRouteDetails({ ...routeDetails, ...eventCounts});
          }
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
    loadLayer(
      mapLayers, mapRef, mapContext,
      'weather', currentWeather, filteredCurrentWeathers, 68,
      referenceData, updateReferenceFeature, setLoadingLayers
    );
  }, [filteredCurrentWeathers]);

  // Regional weathers layer
  useEffect(() => {
    loadLayer(
      mapLayers, mapRef, mapContext,
      'regional', regionalWeather, filteredRegionalWeathers, 69,
      referenceData, updateReferenceFeature, setLoadingLayers
    );
  }, [filteredRegionalWeathers]);

  // High elevation forecasts layer
  useEffect(() => {
    loadLayer(
      mapLayers, mapRef, mapContext,
      'hef', hef, filteredHef, 70,
      referenceData, updateReferenceFeature, setLoadingLayers
    );
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
    loadLayer(
      mapLayers, mapRef, mapContext,
      'borderCrossings', borderCrossings, filteredBorderCrossings, 71,
      referenceData, updateReferenceFeature, setLoadingLayers
    );
  }, [borderCrossings]);

  // Wildfires layer
  useEffect(() => {
    if (!isCamDetail) {
      const featuresDict = loadLayer(
        mapLayers, mapRef, mapContext,
        'wildfires', wildfires, filteredWildfires, 72,
        referenceData, updateReferenceFeature, setLoadingLayers
      );

      setFeatureContext({...featureContext, wildfires: featuresDict});
    }
  }, [wildfires]);

  // Advisories layer
  useEffect(() => {
    const featuresDict = loadLayer(
      mapLayers, mapRef, mapContext,
      'advisoriesLayer', advisories, filteredAdvisories, 5,
      referenceData, updateReferenceFeature, setLoadingLayers
    );

    setFeatureContext({...featureContext, advisories: featuresDict});
  }, [advisories]);

  useEffect(() => {
    const advisoriesData = (filteredAdvisories && filteredAdvisories.length) ? filteredAdvisories : [];

    if (mapRef.current) {
      // First filter
      onMoveEnd(mapRef.current, advisoriesData, setAdvisoriesInView);
      // Create a named function to use for both adding and removing
      const handleMoveEnd = (e) => onMoveEnd(e.map, advisoriesData, setAdvisoriesInView);

      // Set handler for filtering on map move
      mapRef.current.on('moveend', handleMoveEnd);

      // Return cleanup function that removes the listener
      return () => {
        if (mapRef.current) {
          mapRef.current.un('moveend', handleMoveEnd);
        }
      };
    }
  }, [filteredAdvisories]);

  // Reset search params when panel is closed
  useEffect(() => {
    if (searchParamInitialized.current) {
      if (!clickedFeature) {
        searchParams.delete('type');
        searchParams.delete('display_category');
        searchParams.delete('id');
        setSearchParams(searchParams, { replace: true });
      }

    } else {
      searchParamInitialized.current = true;
    }

    if (selectedRoute && clickedFeature && clickedFeature.get('type') !== 'route') {
      dispatch(updateShowRouteObjs(true));
    }
  }, [clickedFeature]);

  useEffect(() => {
    if (!selectedRoute) {
      dispatch(updateShowRouteObjs(false));
    }

    if (panel.current) {
      void panel.current.offsetHeight; // force reflow to update panel height
    }
  }, [selectedRoute]);

  /* Rendering */
  return (
    <div className={`map-container ${isCamDetail ? 'preview' : ''}`} data-vladyoslav-drawer-wrapper="">
      {smallScreen && openTabs &&
        <div className='mobile-mask'></div>
      }

      {searchedRoutes &&
        <DistanceLabels updateRouteDisplay={updateRouteDisplay} mapRef={mapRef} isCamDetail={isCamDetail} />
      }

      {!!openPanel && largeScreen &&
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
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
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

          <div className="panel-content">
            {renderPanel(
              clickedFeature && !clickedFeature.get ? advisoriesInView : clickedFeature,
              isCamDetail,
              smallScreen,
              mapView,
              clickedFeatureRef,
              updateClickedFeature,
              showRouteObjs,
              handleSetShowRouteObjs
            )}
          </div>
        </div>
      }
      
      <div ref={mapElement} className="map">
        {(!isCamDetail && selectedRoute && showRouteObjs && !clickedFeature) && (
          <Button 
            variant="primary-outline" 
            className="btn-outline-primary back-to-routes" 
            onClick={() => dispatch(updateShowRouteObjs(false))}>
            <FontAwesomeIcon icon={faArrowLeft}/>
            Routes
          </Button>
        )}

        {(!smallScreen && !isCamDetail && selectedRoute && showRouteObjs && clickedFeature) && (
          <Button
            variant="primary-outline"
            className="btn-outline-primary back-to-details"
            aria-label={`back to route details`}
            tabIndex={`${openPanel ? 0 : -1}`}
            onKeyDown={(e) => {
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
        )}

        {!largeScreen && (
          <Drawer.Root
            open={openPanel && !largeScreen}
            onOpenChange={(open) => {
              if (!open) {
                resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
              }
            }}
            snapPoints={snapPoints}
            snap={snap}
            setSnap={handleSnapChange}
            modal={false}
            dismissible={true}
            shouldScaleBackground={false}
            scaleFrom={'50%'}
          >
            <Drawer.Portal container={mapElement.current}>
              <Drawer.Overlay className="drawer-overlay" />
              <Drawer.Content className="drawer-content" ref={drawerRef}>
                {clickedFeature && !isCamDetail &&
                  <button
                    className="close-panel"
                    aria-label={`${openPanel ? 'close side panel' : ''}`}
                    aria-hidden={`${openPanel ? false : true}`}
                    tabIndex={`${openPanel ? 0 : -1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
                    }}>
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                }
                <div className="panel-content">
                  <div className="drawer-drag-handle"></div>
                {openPanel && renderPanel(
                  clickedFeature && !clickedFeature.get ? advisoriesInView : clickedFeature,
                  isCamDetail,
                  smallScreen,
                  mapView,
                  clickedFeatureRef,
                  updateClickedFeature,
                  showRouteObjs,
                  handleSetShowRouteObjs
                )}
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        )}

        {!isCamDetail && !smallScreen && (

          <div className={`map-left-container ${(showServerError || showNetworkError) ? 'error-showing' : ''} ${openPanel && 'margin-pushed'} ${isCamDetail && 'hidden'}`}>
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

        {(!isCamDetail && smallScreen && mapRef.current && (!showRouteObjs || clickedFeature)) && (
          <div className="fixed-to-mobile-group"
            style={{
              transform: `translateY(${drawerY}px)`
            }}
          >
            <Button
              ref={myLocationRef}
              className="map-btn my-location fixed-to-mobile"
              variant="primary"
              onClick={loadMyLocation}
              aria-label="my location">
              { myLocationLoading
                ? <Spinner animation="border" role="status" />
                : <FontAwesomeIcon icon={faLocationCrosshairs} />
              }
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
          </div>
        )}

        {(!isCamDetail && !smallScreen && mapRef.current) && (
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
            setZoomPan(mapView, 9, fromLonLat(rootCamera.location.coordinates));

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
          <FontAwesomeIcon icon={faMap} />
          View on map page
        </Button>
      )}

      {isCamDetail && (
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
      )}

      {showLocationAccessError &&
        <LocationAccessPopup marginPushed={!!openPanel} setShowLocationAccessError={setShowLocationAccessError} />
      }

      {showNetworkError &&
        <NetworkErrorPopup marginPushed={!!openPanel} />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup marginPushed={!!openPanel} />
      }

      {staleLinkMessage &&
        <StaleLinkErrorPopup marginPushed={!!openPanel} message={staleLinkMessage}/>
      }
    </div>
  );
}
