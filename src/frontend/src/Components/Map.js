// React
import React, {
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';

// Redux
import { memoize } from 'proxy-memoize';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateCameras,
  updateEvents,
  updateFerries,
  updateWeather,
  updateRegional,
  updateRestStops,
} from '../slices/feedsSlice';
import { updateMapState } from '../slices/mapSlice';
import { updateAdvisories } from '../slices/cmsSlice';

// External Components
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMinus,
  faUpRightAndDownLeftFromCenter,
  faLocationCrosshairs,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import {useMediaQuery} from '@uidotdev/usehooks';

// Components and functions
import CamPopup from './map/camPopup.js';
import {
  getEventPopup,
  getFerryPopup,
  getWeatherPopup,
  getRegionalPopup,
  getRestStopPopup,
} from './map/mapPopup.js';
import { getAdvisories } from './data/advisories.js';
import { getEvents } from './data/events.js';
import { getWeather, getRegional } from './data/weather.js';
import { getRestStops, isRestStopClosed } from './data/restStops.js';
import { getAdvisoriesLayer } from './map/layers/advisoriesLayer.js';
import { getCamerasLayer } from './map/layers/camerasLayer.js';
import { getRestStopsLayer } from './map/layers/restStopsLayer.js';
import { loadEventsLayers } from './map/layers/eventsLayer.js';
import { loadWeatherLayers } from './map/layers/weatherLayer.js';
import { loadRegionalLayers } from './map/layers/regionalLayer.js';
import {
  compareRoutePoints,
  filterByRoute,
  fitMap,
  blueLocationMarkup,
  redLocationMarkup,
  setLocationPin,
  setEventStyle,
  setZoomPan,
  zoomIn,
  zoomOut,
} from './map/helper.js';
import { getFerries } from './data/ferries.js';
import { getFerriesLayer } from './map/layers/ferriesLayer.js';
import { getCameras, addCameraGroups } from './data/webcams.js';
import { getRouteLayer } from './map/routeLayer.js';
import { MapContext } from '../App.js';
import { NetworkError, ServerError } from './data/helper';
import NetworkErrorPopup from './map/errors/NetworkError';
import ServerErrorPopup from './map/errors/ServerError';
import AdvisoriesOnMap from './advisories/AdvisoriesOnMap';
import CurrentCameraIcon from './CurrentCameraIcon';
import Filters from './Filters.js';
import RouteSearch from './map/RouteSearch.js';
import ExitSurvey from './advisories/ExitSurvey.js';
import trackEvent from './TrackEvent.js';

// Map & geospatial imports
import { applyStyle } from 'ol-mapbox-style';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { ScaleLine } from 'ol/control.js';
import { getBottomLeft, getTopRight } from 'ol/extent';
import * as turf from '@turf/turf';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay.js';
import Geolocation from 'ol/Geolocation.js';
import MVT from 'ol/format/MVT.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View';
import overrides from './map/overrides.js';

// Styling
import {
  cameraStyles,
  ferryStyles,
  roadWeatherStyles,
  regionalStyles,
  restStopStyles,
  restStopClosedStyles,
  restStopTruckStyles,
  restStopTruckClosedStyles,
} from './data/featureStyleDefinitions.js';
import './Map.scss';


export default function MapWrapper(props) {
  let { camera, isCamDetail, mapViewRoute, loadCamDetails } = props;

  // Redux
  const dispatch = useDispatch();
  const {
    cameras,
    filteredCameras,
    camFilterPoints, // Cameras
    events,
    filteredEvents,
    eventFilterPoints, // Events
    advisories, // CMS
    ferries,
    filteredFerries,
    ferryFilterPoints, // Ferries
    currentWeather,
    filteredCurrentWeathers,
    currentWeatherFilterPoints, // Current Weather
    regionalWeather,
    filteredRegionalWeathers,
    regionalWeatherFilterPoints,
    regionalTimeStamp, // Regional Weather
    restStops,
    filteredRestStops,
    restStopFilterPoints, // Rest Stops
    searchLocationFrom,
    searchLocationTo,
    selectedRoute, // Routing
    zoom,
    pan, // Map
  } = useSelector(
    useCallback(
      memoize(state => ({
        // Cameras
        cameras: state.feeds.cameras.list,
        filteredCameras: state.feeds.cameras.filteredList,
        camFilterPoints: state.feeds.cameras.filterPoints,
        // Events
        events: state.feeds.events.list,
        filteredEvents: state.feeds.events.filteredList,
        eventFilterPoints: state.feeds.events.filterPoints,
        // CMS
        advisories: state.cms.advisories.list,
        // Ferries
        ferries: state.feeds.ferries.list,
        filteredFerries: state.feeds.ferries.filteredList,
        ferryFilterPoints: state.feeds.ferries.filterPoints,
        // Current Weather
        currentWeather: state.feeds.weather.list,
        filteredCurrentWeathers: state.feeds.weather.filteredList,
        currentWeatherFilterPoints: state.feeds.weather.filterPoints,
        // Regional Weather
        regionalWeather: state.feeds.regional.list,
        filteredRegionalWeathers: state.feeds.regional.filteredList,
        regionalWeatherFilterPoints: state.feeds.regional.filterPoints,
        // Rest Stops
        restStops: state.feeds.restStops.list,
        filteredRestStops: state.feeds.restStops.filteredList,
        restStopFilterPoints: state.feeds.restStops.filterPoints,
        // Routing
        searchLocationFrom: state.routes.searchLocationFrom,
        searchLocationTo: state.routes.searchLocationTo,
        selectedRoute: state.routes.selectedRoute,
        // Map
        zoom: state.map.zoom,
        pan: state.map.pan,
      })),
    ),
  );

  // Context
  const { mapContext, setMapContext } = useContext(MapContext);

  // Refs
  const isInitialMountLocation = useRef('not set');
  const isInitialMountRoute = useRef(true);
  const mapElement = useRef();
  const mapRef = useRef();
  const popup = useRef();
  const panel = useRef();
  const mapLayers = useRef({});
  const mapView = useRef();
  const container = useRef();
  const geolocation = useRef(null);
  const hoveredFeature = useRef();
  const locationPinRef = useRef(null);
  const cameraPopupRef = useRef(null);

  // Workaround for OL handlers not being able to read states
  const [clickedCamera, setClickedCamera] = useState();
  const clickedCameraRef = useRef();
  const updateClickedCamera = feature => {
    clickedCameraRef.current = feature;
    setClickedCamera(feature);
  };

  const [clickedEvent, setClickedEvent] = useState();
  const clickedEventRef = useRef();
  const updateClickedEvent = feature => {
    clickedEventRef.current = feature;
    setClickedEvent(feature);
  };

  const [clickedFerry, setClickedFerry] = useState();
  const clickedFerryRef = useRef();
  const updateClickedFerry = feature => {
    clickedFerryRef.current = feature;
    setClickedFerry(feature);
  };

  const [clickedWeather, setClickedWeather] = useState();
  const clickedWeatherRef = useRef();
  const updateClickedWeather = feature => {
    clickedWeatherRef.current = feature;
    setClickedWeather(feature);
  };

  const [clickedRegional, setClickedRegional] = useState();
  const clickedRegionalRef = useRef();
  const updateClickedRegional = feature => {
    clickedRegionalRef.current = feature;
    setClickedRegional(feature);
  };

  const [clickedRestStop, setClickedRestStop] = useState();
  const clickedRestStopRef = useRef();
  const updateClickedRestStop = feature => {
    clickedRestStopRef.current = feature;
    setClickedRestStop(feature);
  };

  const [advisoriesInView, setAdvisoriesInView] = useState([]);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);

  // Define the function to be executed after the delay
  function resetCameraPopupRef() {
    cameraPopupRef.current = null;
  }

  // initialization hook for the OpenLayers map logic
  useEffect(() => {
    if (mapRef.current) return; // stops map from intializing more than once

    container.current = document.getElementById('popup');

    popup.current = new Overlay({
      element: container.current,
      autoPan: {
        animation: {
          duration: 250,
        },
        margin: 90,
      },
    });

    // base tile map layer
    const vectorLayer = new VectorTileLayer({
      declutter: true,
      source: new VectorTileSource({
        format: new MVT(),
        url: window.BASE_MAP,
      }),
    });

    // initialize starting optional mapLayers
    mapLayers.current = {
      tid: Date.now(),
    };

    // Set map extent (W, S, E, N)
    const extent = [-143.230138, 46.180153, -109.977437, 65.591323];
    const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

    mapView.current = new View({
      projection: 'EPSG:3857',
      constrainResolution: true,
      center: camera ? handleCenter() : fromLonLat(pan),
      zoom: handleZoom(),
      maxZoom: 15,
      extent: transformedExtent,
    });

    // Apply the basemap style from the arcgis resource
    fetch(window.MAP_STYLE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(function (response) {
      response.json().then(function (glStyle) {
        // DBC22-2153
        glStyle.metadata['ol:webfonts'] = '/fonts/{font-family}/{fontweight}{-fontstyle}.css';
        console.log(glStyle);
        for (const layer of glStyle.layers) {
          Object.assign(layer, overrides[layer.id] || {});
        }
        applyStyle(vectorLayer, glStyle, 'esri');
      });
    });

    // create map
    mapRef.current = new Map({
      target: mapElement.current,
      layers: [vectorLayer],
      overlays: [popup.current],
      view: mapView.current,
      pixelRatio: 1.875,
      moveTolerance: 7,
      controls: [new ScaleLine({ units: 'metric' })],
    });
    window.mapRef = mapRef;

    geolocation.current = new Geolocation({
      projection: mapView.current.getProjection(),
    });

    mapRef.current.once('loadstart', async () => {
      if (camera && !isCamDetail) {
        if (camera.event_type) {
          updateClickedEvent(camera);
        } else {
          updateClickedCamera(camera);
        }
      }
    });

    mapRef.current.on('moveend', function () {
      if(smallScreen){
        resetHoveredStates();
      }
      dispatch(
        updateMapState({
          pan: toLonLat(mapView.current.getCenter()),
          zoom: mapView.current.getZoom(),
        }),
      );
    });

    // Click states
    const resetClickedStates = (targetFeature) => {
      // camera is set to data structure rather than map feature
      if (clickedCameraRef.current && !clickedCameraRef.current.setStyle) {
        clickedCameraRef.current = mapLayers.current['highwayCams']
          .getSource()
          .getFeatureById(clickedCameraRef.current.id);
      }

      if (
        clickedCameraRef.current &&
        targetFeature != clickedCameraRef.current
      ) {
        clickedCameraRef.current.setStyle(cameraStyles['static']);
        updateClickedCamera(null);
      }

      // event is set to data structure rather than map feature
      if (clickedEventRef.current && !clickedEventRef.current.ol_uid) {
        const features =
          mapLayers.current[
            clickedEventRef.current.display_category
          ].getSource();
        clickedEventRef.current = features.getFeatureById(
          clickedEventRef.current.id,
        );
      }

      if (clickedEventRef.current && targetFeature != clickedEventRef.current) {
        setEventStyle(clickedEventRef.current, 'static');
        setEventStyle(clickedEventRef.current.get('altFeature') || [], 'static')
        clickedEventRef.current.set('clicked', false);
        updateClickedEvent(null);
      }

      if (clickedFerryRef.current && targetFeature != clickedFerryRef.current) {
        clickedFerryRef.current.setStyle(ferryStyles['static']);
        updateClickedFerry(null);
      }

      if (
        clickedWeatherRef.current &&
        targetFeature !== clickedWeatherRef.current
      ) {
        clickedWeatherRef.current.setStyle(roadWeatherStyles['static']);
        updateClickedWeather(null);
      }

      if (
        clickedRegionalRef.current &&
        targetFeature !== clickedRegionalRef.current
      ) {
        clickedRegionalRef.current.setStyle(regionalStyles['static']);
        updateClickedRegional(null);
      }

      if (
        clickedRestStopRef.current &&
        targetFeature != clickedRestStopRef.current
      ) {
        if (clickedRestStopRef.current !== undefined) {
          const isClosed = isRestStopClosed(
            clickedRestStopRef.current.values_.properties,
          );
          const isLargeVehiclesAccommodated =
            clickedRestStopRef.current.values_.properties
              .ACCOM_COMMERCIAL_TRUCKS === 'Yes'
              ? true
              : false;
          if (isClosed) {
            if (isLargeVehiclesAccommodated) {
              clickedRestStopRef.current.setStyle(
                restStopTruckClosedStyles['static'],
              );
            } else {
              clickedRestStopRef.current.setStyle(
                restStopClosedStyles['static'],
              );
            }
          } else {
            if (isLargeVehiclesAccommodated) {
              clickedRestStopRef.current.setStyle(
                restStopTruckStyles['static'],
              );
            } else {
              clickedRestStopRef.current.setStyle(restStopStyles['static']);
            }
          }
        }
        updateClickedRestStop(null);
      }
    };

    const camClickHandler = feature => {
      if (!isCamDetail) {
        resetClickedStates(feature);

        // set new clicked camera feature
        feature.setStyle(cameraStyles['active']);
        feature.setProperties({ clicked: true }, true);

        updateClickedCamera(feature);

        cameraPopupRef.current = popup;

        setTimeout(resetCameraPopupRef, 500);

      } else {
        setZoomPan(mapView, null, feature.getGeometry().getCoordinates());
        loadCamDetails(feature.getProperties());
      }
    };

    const eventClickHandler = feature => {
      // reset previous clicked feature
      resetClickedStates(feature);

      // set new clicked event feature
      setEventStyle(feature, 'active');
      setEventStyle(feature.get('altFeature') || [], 'active');
      feature.setProperties({ clicked: true }, true);

      updateClickedEvent(feature);
    };

    const ferryClickHandler = feature => {
      // reset previous clicked feature
      resetClickedStates(feature);

      // set new clicked ferry feature
      feature.setStyle(ferryStyles['active']);
      feature.setProperties({ clicked: true }, true);
      updateClickedFerry(feature);
    };

    const weatherClickHandler = feature => {
      // reset previous clicked feature
      resetClickedStates(feature);

      // set new clicked ferry feature
      feature.setStyle(roadWeatherStyles['active']);
      feature.setProperties({ clicked: true }, true);
      updateClickedWeather(feature);
    };

    const regionalClickHandler = feature => {
      // reset previous clicked feature
      resetClickedStates(feature);

      // set new clicked ferry feature
      feature.setStyle(regionalStyles['active']);
      feature.setProperties({ clicked: true }, true);
      updateClickedRegional(feature);
    };

    const restStopClickHandler = feature => {
      // reset previous clicked feature
      resetClickedStates(feature);

      // set new clicked rest stop feature
      const isClosed = isRestStopClosed(feature.values_.properties);
      const isLargeVehiclesAccommodated =
        feature.values_.properties.ACCOM_COMMERCIAL_TRUCKS === 'Yes'
          ? true
          : false;
      if (isClosed) {
        if (isLargeVehiclesAccommodated) {
          feature.setStyle(restStopTruckClosedStyles['active']);
        } else {
          feature.setStyle(restStopClosedStyles['active']);
        }
      } else {
        if (isLargeVehiclesAccommodated) {
          feature.setStyle(restStopTruckStyles['active']);
        } else {
          feature.setStyle(restStopStyles['active']);
        }
      }
      feature.setProperties({ clicked: true }, true);
      updateClickedRestStop(feature);
    };

    mapRef.current.on('click', async e => {
      const features = mapRef.current.getFeaturesAtPixel(e.pixel, {
        hitTolerance: 20,
      });

      if (features.length) {
        const clickedFeature = features[0];
        switch (clickedFeature.getProperties()['type']) {
          case 'camera':
            trackEvent(
              'click',
              'map',
              'camera',
              clickedFeature.getProperties().name,
            );
            camClickHandler(clickedFeature);
            return;
          case 'event':
            eventClickHandler(clickedFeature);
            return;
          case 'ferry':
            trackEvent(
              'click',
              'map',
              'ferry',
              clickedFeature.getProperties().name,
            );
            ferryClickHandler(clickedFeature);
            return;
          case 'weather':
            trackEvent(
              'click',
              'map',
              'weather',
              clickedFeature.getProperties().weather_station_name,
            );
            weatherClickHandler(clickedFeature);
            return;
          case 'regional':
            trackEvent(
              'click',
              'map',
              'regional weather',
              clickedFeature.getProperties().name,
            );
            regionalClickHandler(clickedFeature);
            return;
          case 'rest':
            trackEvent(
              'click',
              'map',
              'rest stop',
              clickedFeature.getProperties().properties.REST_AREA_NAME
            );
            restStopClickHandler(clickedFeature);
            return;
        }
      }

      // Close popups if clicked on blank space
      closePopup();
    });

    // Hover states
    const resetHoveredStates = (targetFeature) => {
      if (hoveredFeature.current && targetFeature != hoveredFeature.current) {
        if (!hoveredFeature.current.getProperties().clicked) {
          switch (hoveredFeature.current.getProperties()['type']) {
            case 'camera':
              hoveredFeature.current.setStyle(cameraStyles['static']);
              break;
            case 'event':
              setEventStyle(hoveredFeature.current, 'static');
              setEventStyle(hoveredFeature.current.get('altFeature') || [], 'static');
              break;
            case 'ferry':
              hoveredFeature.current.setStyle(ferryStyles['static']);
              break;
            case 'weather':
              hoveredFeature.current.setStyle(roadWeatherStyles['static']);
              break;
            case 'regional':
              hoveredFeature.current.setStyle(regionalStyles['static']);
              break;
            case 'rest':
              {
                const isClosed = isRestStopClosed(
                  hoveredFeature.current.values_.properties,
                );
                const isLargeVehiclesAccommodated =
                  hoveredFeature.current.values_.properties
                    .ACCOM_COMMERCIAL_TRUCKS === 'Yes'
                    ? true
                    : false;
                if (isClosed) {
                  if (isLargeVehiclesAccommodated) {
                    hoveredFeature.current.setStyle(
                      restStopTruckClosedStyles['static'],
                    );
                  } else {
                    hoveredFeature.current.setStyle(
                      restStopClosedStyles['static'],
                    );
                  }
                } else {
                  if (isLargeVehiclesAccommodated) {
                    hoveredFeature.current.setStyle(
                      restStopTruckStyles['static'],
                    );
                  } else {
                    hoveredFeature.current.setStyle(restStopStyles['static']);
                  }
                }
              }
              break;
          }
        }

        hoveredFeature.current = null;
      }
    };

    mapRef.current.on('pointermove', async e => {
      const features = mapRef.current.getFeaturesAtPixel(e.pixel, {
        hitTolerance: 20,
      });

      if (features.length) {
        const targetFeature = features[0];
        resetHoveredStates(targetFeature);
        hoveredFeature.current = targetFeature;
        switch (targetFeature.getProperties()['type']) {
          case 'camera':
            if (!targetFeature.getProperties().clicked) {
              targetFeature.setStyle(cameraStyles['hover']);
            }
            return;
          case 'event':
            if (!targetFeature.getProperties().clicked) {
              setEventStyle(targetFeature, 'hover');
              setEventStyle(targetFeature.get('altFeature') || [], 'hover');
            }
            return;
          case 'ferry':
            if (!targetFeature.getProperties().clicked) {
              targetFeature.setStyle(ferryStyles['hover']);
            }
            return;
          case 'weather':
            if (!targetFeature.getProperties().clicked) {
              targetFeature.setStyle(roadWeatherStyles['hover']);
            }
            return;
          case 'rest':
            if (!targetFeature.getProperties().clicked) {
              const isClosed = isRestStopClosed(
                targetFeature.values_.properties,
              );
              const isLargeVehiclesAccommodated =
                targetFeature.values_.properties.ACCOM_COMMERCIAL_TRUCKS ===
                'Yes'
                  ? true
                  : false;
              if (isClosed) {
                if (isLargeVehiclesAccommodated) {
                  targetFeature.setStyle(restStopTruckClosedStyles['hover']);
                } else {
                  targetFeature.setStyle(restStopClosedStyles['hover']);
                }
              } else {
                if (isLargeVehiclesAccommodated) {
                  targetFeature.setStyle(restStopTruckStyles['hover']);
                } else {
                  targetFeature.setStyle(restStopStyles['hover']);
                }
              }
            }
            return;
          case 'regional':
            if (!targetFeature.getProperties().clicked) {
              targetFeature.setStyle(regionalStyles['hover']);
            }
            return;
        }
      }

      // Reset on blank space
      resetHoveredStates(null);
    });

    loadData(true);
  });

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  // Location search
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
      );

      if (isInitialMountLocation.current === 'not set') {
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
    }
  }, [searchLocationFrom]);

  // Route layer
  useEffect(() => {
    if (isInitialMountRoute.current) {
      // Do nothing on first load
      isInitialMountRoute.current = false;
      return;
    }

    // Remove existing layer and reload data on route change
    if (mapLayers.current['routeLayer']) {
      mapRef.current.removeLayer(mapLayers.current['routeLayer']);
    }

    loadData(false);
  }, [selectedRoute]);

  const loadCameras = async route => {
    const routePoints = route ? route.points : null;

    // Load if filtered cams don't exist or route doesn't match
    if (!filteredCameras || !compareRoutePoints(routePoints, camFilterPoints)) {
      // Fetch data if it doesn't already exist
      const camData = cameras ? cameras : await getCameras().catch((error) => displayError(error));

      // Filter data by route
      const filteredCamData = route ? filterByRoute(camData, route, null, true) : camData;

      dispatch(
        updateCameras({
          list: camData,
          filteredList: filteredCamData,
          filterPoints: route ? route.points : null
        })
      );
    }
  };

  useEffect(() => {
    // Remove layer if it already exists
    if (mapLayers.current['highwayCams']) {
      mapRef.current.removeLayer(mapLayers.current['highwayCams']);
    }

    // Add layer if array exists
    if (filteredCameras) {
      // Deep clone and add group reference to each cam
      const clonedCameras = JSON.parse(JSON.stringify(filteredCameras));
      const finalCameras = addCameraGroups(clonedCameras);

      // Generate and add layer
      mapLayers.current['highwayCams'] = getCamerasLayer(
        finalCameras,
        mapRef.current.getView().getProjection().getCode(),
        mapContext
      );

      mapRef.current.addLayer(mapLayers.current['highwayCams']);
      mapLayers.current['highwayCams'].setZIndex(78);
    }
  }, [filteredCameras]);

  // Event layers
  const loadEvents = async route => {
    const routePoints = route ? route.points : null;

    // Load if filtered events don't exist or route doesn't match
    if (!filteredEvents || !compareRoutePoints(routePoints, eventFilterPoints)) {
      // Fetch data if it doesn't already exist
      const eventData = events ? events : await getEvents().catch((error) => displayError(error));

      // Filter data by route
      const filteredEventData = route ? filterByRoute(eventData, route) : eventData;

      dispatch(
        updateEvents({
          list: eventData,
          filteredList: filteredEventData,
          filterPoints: route ? route.points : null
        })
      );
    }
  };

  useEffect(() => {
    loadEventsLayers(filteredEvents, mapContext, mapLayers, mapRef);
  }, [filteredEvents]);

  // Ferries layer
  const loadFerries = async route => {
    const routePoints = route ? route.points : null;

    // Load if filtered cams don't exist or route doesn't match
    if (!filteredFerries || !compareRoutePoints(routePoints, ferryFilterPoints)) {
      // Fetch data if it doesn't already exist
      const ferryData = ferries ? ferries : await getFerries().catch((error) => displayError(error));

      // Filter data by route
      const filteredFerryData = route ? filterByRoute(ferryData, route) : ferryData;

      dispatch(
        updateFerries({
          list: ferryData,
          filteredList: filteredFerryData,
          filterPoints: route ? route.points : null
        })
      );
    }
  };

  useEffect(() => {
    // Remove layer if it already exists
    if (mapLayers.current['inlandFerries']) {
      mapRef.current.removeLayer(mapLayers.current['inlandFerries']);
    }

    // Add layer if array exists
    if (filteredFerries) {
      // Generate and add layer
      mapLayers.current['inlandFerries'] = getFerriesLayer(
        filteredFerries,
        mapRef.current.getView().getProjection().getCode(),
        mapContext,
      );

      mapRef.current.addLayer(mapLayers.current['inlandFerries']);
      mapLayers.current['inlandFerries'].setZIndex(68);
    }
  }, [filteredFerries]);

  // Rest stops layer
  const loadRestStops = async route => {
    const routePoints = route ? route.points : null;

    // Load if filtered cams don't exist or route doesn't match
    if (!filteredRestStops || !compareRoutePoints(routePoints, restStopFilterPoints)) {
      // Fetch data if it doesn't already exist
      const restStopsData = restStops ? restStops : await getRestStops().catch((error) => displayError(error));

      // Filter data by route
      const filteredRestStopsData = route ? filterByRoute(restStopsData, route) : restStopsData;

      dispatch(
        updateRestStops({
          list: restStopsData,
          filteredList: filteredRestStopsData,
          filterPoints: route ? route.points : null
        })
      );
    }
  };

  useEffect(() => {
    // Remove layer if it already exists
    if (mapLayers.current['restStops']) {
      mapRef.current.removeLayer(mapLayers.current['restStops']);
    }

    // Add layer if array exists
    if (filteredRestStops) {
      // Generate and add layer
      mapLayers.current['restStops'] = getRestStopsLayer(
        filteredRestStops,
        mapRef.current.getView().getProjection().getCode(),
        mapContext,
      );

      mapRef.current.addLayer(mapLayers.current['restStops']);
      mapLayers.current['restStops'].setZIndex(68);
    }
  }, [filteredRestStops]);

  // Current weather layer
  const loadWeather = async route => {
    const routePoints = route ? route.points : null;

    // Load if filtered cams don't exist or route doesn't match
    if (!filteredCurrentWeathers || !compareRoutePoints(routePoints, currentWeatherFilterPoints)) {
      // Fetch data if it doesn't already exist
      const currentWeathersData = currentWeather ? currentWeather : await getWeather().catch((error) => displayError(error));

      // Filter data by route
      const filteredCurrentWeathersData = route ? filterByRoute(currentWeathersData, route, 15000) : currentWeathersData;

      dispatch(
        updateWeather({
          list: currentWeathersData,
          filteredList: filteredCurrentWeathersData,
          filterPoints: route ? route.points : null
        })
      );
    }
  };

  useEffect(() => {
    if (mapLayers.current['weather']) {
      mapRef.current.removeLayer(mapLayers.current['weather']);
    }

    if (filteredCurrentWeathers) {
      mapLayers.current['weather'] = loadWeatherLayers(
        filteredCurrentWeathers,
        mapContext,
        mapRef.current.getView().getProjection().getCode(),
      );
      mapRef.current.addLayer(mapLayers.current['weather']);
      mapLayers.current['weather'].setZIndex(66);
    }
  }, [filteredCurrentWeathers]);

  // Advisories helper functions
  function wrapLon(value) {
    const worlds = Math.floor((value + 180) / 360);
    return value - worlds * 360;
  }

  function onMoveEnd(evt) {
    // calculate polygon based on map extent
    const map = evt.map;
    const extent = map.getView().calculateExtent(map.getSize());
    const bottomLeft = toLonLat(getBottomLeft(extent));
    const topRight = toLonLat(getTopRight(extent));

    const mapPoly = turf.polygon([[
      [wrapLon(bottomLeft[0]), topRight[1]], // Top left
      [wrapLon(bottomLeft[0]), bottomLeft[1]], // Bottom left
      [wrapLon(topRight[0]), bottomLeft[1]], // Bottom right
      [wrapLon(topRight[0]), topRight[1]], // Top right
      [wrapLon(bottomLeft[0]), topRight[1]], // Top left
    ]]);

    // Update state with advisories that intersect with map extent
    const resAdvisories = [];
    if (advisories && advisories.length > 0) {
      advisories.forEach(advisory => {
        const advPoly = turf.polygon(advisory.geometry.coordinates);
        if (turf.booleanIntersects(mapPoly, advPoly)) {
          resAdvisories.push(advisory);
        }
      });
    }
    setAdvisoriesInView(resAdvisories);
  }

  // Advisories layer
  const loadAdvisories = async () => {
    // Fetch data if it doesn't already exist
    if (!advisories) {
      dispatch(
        updateAdvisories({
          list: await getAdvisories().catch((error) => displayError(error)),
          timeStamp: new Date().getTime(),
        }),
      );
    }
  };

  useEffect(() => {
    // Remove layer if it already exists
    if (mapLayers.current['advisoriesLayer']) {
      mapRef.current.removeLayer(mapLayers.current['advisoriesLayer']);
    }

    // Add layer if array exists
    if (advisories) {
      // Generate and add layer
      mapLayers.current['advisoriesLayer'] = getAdvisoriesLayer(
        advisories,
        mapRef.current.getView().getProjection().getCode(),
        mapContext,
      );

      mapRef.current.addLayer(mapLayers.current['advisoriesLayer']);
      mapLayers.current['advisoriesLayer'].setZIndex(5);

      if (mapRef.current) {
        mapRef.current.on('moveend', onMoveEnd);
      }
    }
  }, [advisories]);

  // Regional weather layer
  const loadRegional = async route => {
    const routePoints = route ? route.points : null;

    // Load if filtered cams don't exist or route doesn't match
    if (!filteredRegionalWeathers || !compareRoutePoints(routePoints, regionalWeatherFilterPoints)) {
      // Fetch data if it doesn't already exist
      const regionalWeathersData = regionalWeather ? regionalWeather : await getRegional().catch((error) => displayError(error));

      // Filter with 20km extra tolerance
      const filteredRegionalWeathersData = filterByRoute(regionalWeathersData, route, 15000);

      dispatch(
        updateRegional({
          list: regionalWeathersData,
          filteredList: filteredRegionalWeathersData,
          filterPoints: route ? route.points : null
        })
      );
    }
  };

  useEffect(() => {
    if (mapLayers.current['regional']) {
      mapRef.current.removeLayer(mapLayers.current['regional']);
    }

    if (filteredRegionalWeathers) {
      mapLayers.current['regional'] = loadRegionalLayers(
        filteredRegionalWeathers,
        mapContext,
        mapRef.current.getView().getProjection().getCode(),
      );
      mapRef.current.addLayer(mapLayers.current['regional']);
      mapLayers.current['regional'].setZIndex(67);
    }
  }, [filteredRegionalWeathers]);

  // Function to load all data
  const loadData = isInitialMount => {
    if (selectedRoute && selectedRoute.routeFound) {
      const routeLayer = getRouteLayer(
        selectedRoute,
        mapRef.current.getView().getProjection().getCode(),
      );
      mapLayers.current['routeLayer'] = routeLayer;
      mapRef.current.addLayer(routeLayer);

      // Clear and update data
      loadCameras(selectedRoute);
      loadEvents(selectedRoute);
      loadFerries(selectedRoute);
      loadWeather(selectedRoute);
      loadRegional(selectedRoute);
      loadRestStops(selectedRoute);
      loadAdvisories();

      // Zoom/pan to route on route updates
      if (!isInitialMount) {
        fitMap(selectedRoute.route, mapView);
      }
    } else {
      // Clear and update data
      loadCameras();
      loadEvents();
      loadFerries();
      loadWeather();
      loadRegional();
      loadRestStops();
      loadAdvisories();
    }
  };

  function closePopup() {
    // camera is set to data structure rather than map feature
    if (clickedCameraRef.current && !clickedCameraRef.current.setStyle) {
      clickedCameraRef.current = mapLayers.current['highwayCams']
        .getSource()
        .getFeatureById(clickedCameraRef.current.id);
    }

    // check for active camera icons
    if (clickedCameraRef.current) {
      clickedCameraRef.current.setStyle(cameraStyles['static']);
      clickedCameraRef.current.set('clicked', false);
      updateClickedCamera(null);
    }

    // check for active event icons

    // event is set to data structure rather than map feature
    if (clickedEventRef.current && !clickedEventRef.current.ol_uid) {
      const features =
        mapLayers.current[clickedEventRef.current.display_category].getSource();
      clickedEventRef.current = features.getFeatureById(
        clickedEventRef.current.id,
      );
    }

    if (clickedEventRef.current) {
      setEventStyle(clickedEventRef.current, 'static');
      setEventStyle(clickedEventRef.current.get('altFeature') || [], 'static');
      clickedEventRef.current.set('clicked', false);
      updateClickedEvent(null);
    }

    // check for active ferry icons
    if (clickedFerryRef.current) {
      clickedFerryRef.current.setStyle(ferryStyles['static']);
      clickedFerryRef.current.set('clicked', false);
      updateClickedFerry(null);
    }

    // check for active weather icons
    if (clickedWeatherRef.current) {
      clickedWeatherRef.current.setStyle(roadWeatherStyles['static']);
      clickedWeatherRef.current.set('clicked', false);
      updateClickedWeather(null);
    }

    // check for active weather icons
    if (clickedRegionalRef.current) {
      clickedRegionalRef.current.setStyle(regionalStyles['static']);
      clickedRegionalRef.current.set('clicked', false);
      updateClickedRegional(null);
    }

    // check for active rest stop icons
    if (clickedRestStopRef.current) {
      const isClosed = isRestStopClosed(clickedRestStopRef.current.properties);
      const isLargeVehiclesAccommodated = clickedRestStopRef.current.properties
        ? clickedRestStopRef.current.properties.ACCOM_COMMERCIAL_TRUCKS ===
          'Yes'
        : false;
      if (isClosed) {
        if (isLargeVehiclesAccommodated) {
          clickedRestStopRef.current.setStyle(
            restStopTruckClosedStyles['static'],
          );
        } else {
          clickedRestStopRef.current.setStyle(restStopClosedStyles['static']);
        }
      } else {
        if (isLargeVehiclesAccommodated) {
          clickedRestStopRef.current.setStyle(restStopTruckStyles['static']);
        } else {
          clickedRestStopRef.current.setStyle(restStopStyles['static']);
        }
      }
      clickedRestStopRef.current.set('clicked', false);
      updateClickedRestStop(null);
    }

    // Reset cam popup handler lock timer
    cameraPopupRef.current = null;
  }

  function toggleMyLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          if (
            position.coords.longitude <= -113.7 &&
            position.coords.longitude >= -139.3 &&
            position.coords.latitude <= 60.1 &&
            position.coords.latitude >= 48.2
          ) {
            setZoomPan(mapView, 9, fromLonLat([longitude, latitude]));
            setLocationPin([longitude, latitude], redLocationMarkup, mapRef);
          } else {
            // set my location to the center of BC for users outside of BC
            setZoomPan(mapView, 9, fromLonLat([-126.5, 54.2]));
            setLocationPin([-126.5, 54.2], redLocationMarkup, mapRef);
          }
        },
        error => {
          if (error.code === error.PERMISSION_DENIED) {
            // The user has blocked location access
            console.error('Location access denied by user.', error);
          } else {
            // Zoom out and center to BC if location not available
            setZoomPan(mapView, 9, fromLonLat([-126.5, 54.2]));
          }
        },
      );
    }
  }

  function togglePanel() {
    panel.current.classList.toggle('open');
    panel.current.classList.remove('maximized');
    if (!panel.current.classList.contains('open')) {
      closePopup();
    }
  }

  function maximizePanel() {
    if (panel.current.classList.contains('open')) {
      if (!panel.current.classList.contains('maximized')) {
        panel.current.classList.add('maximized');
      } else {
        panel.current.classList.remove('maximized');
      }
    }
  }

  function handleCenter() {
    if (typeof camera === 'string') {
      camera = JSON.parse(camera);
    }
    return Array.isArray(camera.location.coordinates[0])
      ? fromLonLat(
          camera.location.coordinates[
            Math.floor(camera.location.coordinates.length / 2)
          ],
        )
      : fromLonLat(camera.location.coordinates);
  }

  function handleZoom() {
    if (typeof camera === 'string') {
      camera = JSON.parse(camera);
    }
    if (isCamDetail || camera) {
      return 12;
    } else {
      return zoom;
    }
  }

  function toggleLayer(layer, checked) {
    mapLayers.current[layer].setVisible(checked);

    // Set context and local storage
    mapContext.visible_layers[layer] = checked;
    setMapContext(mapContext);
    localStorage.setItem('mapContext', JSON.stringify(mapContext));
  }

  // Force camera and inland ferries filters to be checked on preview mode
  if (isCamDetail) {
    mapContext.visible_layers['highwayCams'] = true;
    mapContext.visible_layers['inlandFerries'] = true;
  }

  const openPanel = !!(
    clickedCamera ||
    clickedEvent ||
    clickedFerry ||
    clickedWeather ||
    clickedRegional ||
    clickedRestStop
  );

  const smallScreen = useMediaQuery('only screen and (max-width: 767px)');

  return (
    <div className={`map-container ${isCamDetail ? 'preview' : ''}`}>
      <div
        ref={panel}
        className={`side-panel ${openPanel ? 'open' : ''}`}
        onClick={maximizePanel}
        onTouchMove={maximizePanel}
        onKeyDown={keyEvent => {
          if (keyEvent.keyCode == 13) {
            maximizePanel();
          }
        }}>
        <button
          className="close-panel"
          aria-label={`${openPanel ? 'close side panel' : ''}`}
          aria-hidden={`${openPanel ? false : true}`}
          tabIndex={`${openPanel ? 0 : -1}`}
          onClick={togglePanel}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="panel-content">
          {clickedCamera && (
            <CamPopup camFeature={clickedCamera} isCamDetail={isCamDetail} />
          )}

          {clickedEvent && getEventPopup(clickedEvent)}

          {clickedFerry && getFerryPopup(clickedFerry)}

          {clickedWeather && getWeatherPopup(clickedWeather)}

          {clickedRegional && getRegionalPopup(clickedRegional)}

          {clickedRestStop && getRestStopPopup(clickedRestStop)}
        </div>
      </div>

      <div ref={mapElement} className="map">

        {!isCamDetail && (
          <div className={`map-left-container ${(showServerError || showNetworkError) ? 'error-showing' : ''}`}>
            {smallScreen && (
              <ExitSurvey mobile={true} />
            )}
            <RouteSearch routeEdit={true} />
            <AdvisoriesOnMap advisories={advisoriesInView} />
          </div>
        )}

        {(!isCamDetail && smallScreen) && (
          <React.Fragment>
            <Button
              className="map-btn my-location"
              variant="primary"
              onClick={toggleMyLocation}
              aria-label="my location">
              <FontAwesomeIcon icon={faLocationCrosshairs} />
              My location
            </Button>
            <Filters
              toggleHandler={toggleLayer}
              disableFeatures={isCamDetail}
              enableRoadConditions={true}
            />
          </React.Fragment>
        )}

        {(!isCamDetail && !smallScreen) && (
          <React.Fragment>
            <Filters
              toggleHandler={toggleLayer}
              disableFeatures={isCamDetail}
              enableRoadConditions={true}
            />
            <Button
              className="map-btn my-location"
              variant="primary"
              onClick={toggleMyLocation}
              aria-label="my location">
              <FontAwesomeIcon icon={faLocationCrosshairs} />
              My location
            </Button>
            <ExitSurvey />
          </React.Fragment>
        )}

        <div className="map-btn zoom-btn">
          <Button
            className="zoom-in"
            variant="primary"
            aria-label="zoom in"
            onClick={() => zoomIn(mapView)}>
            <FontAwesomeIcon icon={faPlus} />
          </Button>
          <div className="zoom-divider" />
          <Button
            className="zoom-out"
            variant="primary"
            onClick={() => zoomOut(mapView)}
            aria-label="zoom out">
            <FontAwesomeIcon icon={faMinus} />
          </Button>
        </div>

      </div>

      <div id="popup" className="ol-popup">
        <div id="popup-content" className="ol-popup-content"></div>
      </div>

      {isCamDetail && (
        <Button
          className="map-btn cam-location"
          variant="primary"
          onClick={() => {
            if (camera) {
              setZoomPan(mapView, 12, fromLonLat(camera.location.coordinates));
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
          toggleHandler={toggleLayer}
          disableFeatures={isCamDetail}
          enableRoadConditions={true}
          textOverride={'Layer filters'}
        />
      )}

      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }
    </div>
  );
}
