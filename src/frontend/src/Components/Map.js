// React
import React, { useContext, useRef, useEffect, useState, useCallback } from 'react';

// Navigation
import { useNavigate } from 'react-router-dom';

// Redux
import { useSelector, useDispatch } from 'react-redux'
import { memoize } from 'proxy-memoize'
import { updateMapState } from '../slices/mapSlice';
import { updateCameras } from '../slices/camerasSlice';
import { updateEvents } from '../slices/eventsSlice';
import { updateFerries } from '../slices/cmsSlice';

// External Components
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMinus,
  faUpRightAndDownLeftFromCenter,
  faLocationCrosshairs,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

// Components and functions
import CamPopup from './map/camPopup.js'
import { getCamerasLayer } from './map/layers/camerasLayer.js';
import { getEventPopup, getFerryPopup } from './map/mapPopup.js'
import { getEvents } from './data/events.js';
import { loadEventsLayers } from './map/layers/eventsLayer.js';
import {
  fitMap,
  blueLocationMarkup,
  redLocationMarkup,
  setLocationPin,
  getEventIcon,
  setZoomPan,
  zoomIn,
  zoomOut
} from './map/helper.js';
import { getFerries } from './data/ferries.js';
import { getFerriesLayer } from './map/layers/ferriesLayer.js';
import { getCameras, addCameraGroups } from './data/webcams.js';
import { getRouteLayer } from './map/routeLayer.js';
import { MapContext } from '../App.js';
import AdvisoriesAccordion from './advisories/AdvisoriesAccordion';
import CurrentCameraIcon from './CurrentCameraIcon';
import Filters from './Filters.js';
import RouteSearch from './map/RouteSearch.js';
import { setIsEventClicked } from '../slices/routesSlice.js';

// OpenLayers
import { applyStyle } from 'ol-mapbox-style';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { ScaleLine } from 'ol/control.js';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay.js';
import Geolocation from 'ol/Geolocation.js';
import MVT from 'ol/format/MVT.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View';

// Styling
import { cameraStyles, ferryStyles } from './data/featureStyleDefinitions.js';
import './Map.scss';

export default function MapWrapper({
  camera,
  isPreview,
  cameraHandler,
  mapViewRoute,
  event,
}) {
  // Redux
  const dispatch = useDispatch();
  const {
    cameras, camTimeStamp, // Cameras
    events, eventTimeStamp, // Events
    ferries, ferriesTimeStamp, // CMS
    searchLocationFrom, selectedRoute, // Routing
    zoom, pan, // Map

  } = useSelector(useCallback(memoize(state => ({
    // Cameras
    cameras: state.cameras.list,
    camTimeStamp: state.cameras.routeTimeStamp,
    // Events
    events: state.events.list,
    eventTimeStamp: state.events.routeTimeStamp,
    // CMS
    ferries: state.cms.ferries.list,
    ferriesTimeStamp: state.cms.ferries.routeTimeStamp,
    // Routing
    searchLocationFrom: state.routes.searchLocationFrom,
    selectedRoute: state.routes.selectedRoute,
    // Map
    zoom: state.map.zoom,
    pan: state.map.pan
  }))));

  const isEventClicked = useSelector(state => state.routes.isEventClicked); 
  // Context
  const { mapContext, setMapContext } = useContext(MapContext);

  // Refs
  const isInitialMount = useRef(true);
  const mapElement = useRef();
  const mapRef = useRef();
  const popup = useRef();
  const mapLayers = useRef({});
  const mapView = useRef();
  const container = useRef();
  const geolocation = useRef(null);
  const hoveredFeature = useRef();
  const locationPinRef = useRef(null);
  const cameraPopupRef = useRef(null);

  // Misc
  const navigate = useNavigate();

  // Workaround for OL handlers not being able to read states
  const [clickedCamera, setClickedCamera] = useState();
  const clickedCameraRef = useRef();
  const updateClickedCamera = (feature) => {
    clickedCameraRef.current = feature;
    setClickedCamera(feature);
  }

  const [clickedEvent, setClickedEvent] = useState();
  const clickedEventRef = useRef();
  const updateClickedEvent = (feature) => {
    clickedEventRef.current = feature;
    setClickedEvent(feature);
  }

  const [clickedFerry, setClickedFerry] = useState();
  const clickedFerryRef = useRef();
  const updateClickedFerry = (feature) => {
    clickedFerryRef.current = feature;
    setClickedFerry(feature);
  }

  function centerMap(coordinates) {
    if (mapView.current) {
      mapView.current.animate({
        center: fromLonLat(coordinates),
      });
    }
  }

  // Define the function to be executed after the delay
  function resetCameraPopupRef() {
      cameraPopupRef.current = null;
    }

  useEffect(() => {
    // initialization hook for the OpenLayers map logic
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

    const vectorLayer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: window.BASE_MAP,
      }),
    });

    // initialize starting optional mapLayers
    mapLayers.current = {
      tid: Date.now(),
    };

    // Set map extent
    const extent = [-143.23013896362576, 65.59132385849652, -109.97743701256154, 46.18015377362468];
    const transformedExtent = transformExtent(extent,'EPSG:4326','EPSG:3857');

    mapView.current = new View({
      projection: 'EPSG:3857',
      constrainResolution: true,
      center: camera ? handleCenter() : fromLonLat(pan),
      zoom: handleZoom(),
      maxZoom: 15,
      extent: transformedExtent
    });

    // Apply the basemap style from the arcgis resource
    fetch(window.MAP_STYLE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(function (response) {
      response.json().then(function (glStyle) {
        // overriding default font value so it doesn't return errors.
        glStyle.metadata['ol:webfonts'] = '';
        applyStyle(vectorLayer, glStyle, 'esri');
      });
    });

    // create map
    mapRef.current = new Map({
      target: mapElement.current,
      layers: [vectorLayer],
      overlays: [popup.current],
      view: mapView.current,
      controls: [new ScaleLine({ units: 'metric' })],
    });

    geolocation.current = new Geolocation({
      projection: mapView.current.getProjection(),
    });

    mapRef.current.once('loadstart', async () => {
      if (camera && !isPreview) {
        popup.current.setPosition(handleCenter(camera));
        popup.current.getElement().style.top = '40px';

        if (camera.event_type) {
          updateClickedEvent(camera);

        } else {
          updateClickedCamera(camera);
        }
      }
    });

    mapRef.current.on('moveend', function () {
      dispatch(updateMapState({pan: toLonLat(mapView.current.getCenter()), zoom: mapView.current.getZoom()}))
    });

    // Click states
    const resetClickedStates = (targetFeature) => {
      if (clickedCameraRef.current && targetFeature != clickedCameraRef.current) {
        clickedCameraRef.current.setStyle(cameraStyles['static']);
        updateClickedCamera(null);
      }

      if (clickedEventRef.current && targetFeature != clickedEventRef.current) {
        clickedEventRef.current.setStyle(
          getEventIcon(clickedEventRef.current, 'static'),
        );

        // Set associated line/point feature
        const altFeature = clickedEventRef.current.getProperties()['altFeature'];
        if (altFeature) {
          altFeature.setStyle(getEventIcon(altFeature, 'static'));
        }

        updateClickedEvent(null);
      }

      if (clickedFerryRef.current && targetFeature != clickedFerryRef.current) {
        clickedFerryRef.current.setStyle(ferryStyles['static']);
        updateClickedFerry(null);
      }
    }

    const camClickHandler = (feature) => {
      resetClickedStates(feature);

      // set new clicked camera feature
      feature.setStyle(cameraStyles['active']);
      feature.setProperties({ clicked: true }, true);

      popup.current.setPosition(
        feature.getGeometry().getCoordinates(),
      );
      popup.current.getElement().style.top = '40px';

      updateClickedCamera(feature);

      cameraPopupRef.current = popup;

      setTimeout(resetCameraPopupRef, 500);
    }

    const eventClickHandler = (feature) => {
      // reset previous clicked feature
      resetClickedStates(feature);

      // set new clicked event feature
      feature.setStyle(getEventIcon(feature, 'active'));
      feature.setProperties({ clicked: true }, true);

      // Set associated line/point feature
      const altFeature = feature.getProperties()['altFeature'];
      if (altFeature) {
        altFeature.setStyle(getEventIcon(altFeature, 'active'));
        altFeature.setProperties({ clicked: true }, true);
      }

      updateClickedEvent(feature);

      popup.current.setPosition(
        feature.getGeometry().getCoordinates(),
      );
      popup.current.getElement().style.top = '40px';
    }

    const ferryClickHandler = (feature) => {
      // reset previous clicked feature
      resetClickedStates(feature);

      // set new clicked ferry feature
      feature.setStyle(ferryStyles['active']);
      feature.setProperties({ clicked: true }, true);
      updateClickedFerry(feature);

      popup.current.setPosition(
        feature.getGeometry().getCoordinates(),
      );
      popup.current.getElement().style.top = '40px';
    }

    mapRef.current.on('click', async (e) => {
      const features = mapRef.current.getFeaturesAtPixel(e.pixel, {
        hitTolerance: 20,
      });

      if (features.length) {
        const clickedFeature = features[0];
        switch(clickedFeature.getProperties()['type']) {
          case 'camera':
            camClickHandler(clickedFeature);
            return;
          case 'event':
            eventClickHandler(clickedFeature);
            return;
          case 'ferry':
            ferryClickHandler(clickedFeature);
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
            case 'event': {
              hoveredFeature.current.setStyle(getEventIcon(hoveredFeature.current, 'static'));

              // Set associated line/point feature
              const altFeature = hoveredFeature.current.getProperties()['altFeature'];
              if (altFeature) {
                altFeature.setStyle(getEventIcon(altFeature, 'static'));
              }
              break;
            }
            case 'ferry':
              hoveredFeature.current.setStyle(ferryStyles['static']);
              break;
          }
        }

        hoveredFeature.current = null;
      }
    }

    mapRef.current.on('pointermove', async (e) => {
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
              targetFeature.setStyle(getEventIcon(targetFeature, 'hover'));

              // Set associated line/point feature
              const altFeature = targetFeature.getProperties()['altFeature'];
              if (altFeature) {
                altFeature.setStyle(getEventIcon(altFeature, 'hover'));
              }
            }
            return;
          case 'ferry':
            if (!targetFeature.getProperties().clicked) {
              targetFeature.setStyle(ferryStyles['hover']);
            }
            return;
        }
      }

      // Reset on blank space
      resetHoveredStates(null);
    });

    if (!camera) {
      // if there is no parameter for shifting the view, pan to my location
      toggleMyLocation();
    }

    loadData();
  });

  useEffect(() => {
    if (searchLocationFrom && searchLocationFrom.length) {
      if (locationPinRef.current) {
        mapRef.current.removeOverlay(locationPinRef.current);
      }
      // centerMap(searchLocationFrom[0].geometry.coordinates);
      let focusedCoordinates = undefined;
      if (event === null) {
        dispatch(setIsEventClicked(false));
        focusedCoordinates = searchLocationFrom[0].geometry.coordinates;
      } else {
        dispatch(setIsEventClicked(true));
        if(event.location !== undefined){
          focusedCoordinates = (event.location.type === 'Point')? event.location.coordinates : event.location.coordinates[0];
        }
        else{
          dispatch(setIsEventClicked(false));
          focusedCoordinates = searchLocationFrom[0].geometry.coordinates;
        }
      }
      centerMap(focusedCoordinates);
      setLocationPin(
        focusedCoordinates,
        blueLocationMarkup,
        mapRef,
        locationPinRef
      );
    }
  }, [searchLocationFrom]);

  useEffect(() => {
    if (isInitialMount.current) { // Do nothing on first load
      isInitialMount.current = false;
      return;
    }

    // Remove existing layer and reload data on route change
    if (mapLayers.current['routeLayer']) {
      mapRef.current.removeLayer(mapLayers.current['routeLayer']);
    }

    loadData();
  }, [selectedRoute]);

  useEffect(() => {
    // Remove layer if it already exists
    if (mapLayers.current['highwayCams']) {
      mapRef.current.removeLayer(mapLayers.current['highwayCams']);
    }

    // Add layer if array exists
    if (cameras) {
      // Deep clone and add group reference to each cam
      const clonedCameras = JSON.parse(JSON.stringify(cameras));
      const finalCameras = addCameraGroups(clonedCameras);

      // Generate and add layer
      mapLayers.current['highwayCams'] = getCamerasLayer(
        finalCameras,
        mapRef.current.getView().getProjection().getCode(),
        mapContext,
        camera,
        updateClickedCamera,
      )

      mapRef.current.addLayer(mapLayers.current['highwayCams']);
      mapLayers.current['highwayCams'].setZIndex(4);
    }
  }, [cameras]);

  const loadCameras = async (route) => {
    const newRouteTimestamp = route ? route.searchTimestamp : null;

    // Fetch data if it doesn't already exist or route was updated
//    if (!cameras || (camTimeStamp != newRouteTimestamp)) {
      dispatch(updateCameras({
        list: await getCameras(route ? route.points : null),
        routeTimeStamp: route ? route.searchTimestamp : null,
      }));
//    }
  }

  useEffect(() => {
    loadEventsLayers(events, mapContext, mapLayers, mapRef);
  }, [events]);

  const loadEvents = async (route) => {
    const newRouteTimestamp = route ? route.searchTimestamp : null;

    // Fetch data if it doesn't already exist or route was updated
//    if (!events || (eventTimeStamp != newRouteTimestamp)) {
      dispatch(updateEvents({
        list: await getEvents(route ? route.points : null),
        routeTimeStamp: route ? route.searchTimestamp : null,
      }));
//    }
  }

  useEffect(() => {
    // Remove layer if it already exists
    if (mapLayers.current['inlandFerries']) {
      mapRef.current.removeLayer(mapLayers.current['inlandFerries']);
    }

    // Add layer if array exists
    if (ferries) {
      // Generate and add layer
      mapLayers.current['inlandFerries'] = getFerriesLayer(
        ferries,
        mapRef.current.getView().getProjection().getCode(),
        mapContext
      )

      mapRef.current.addLayer(mapLayers.current['inlandFerries']);
      mapLayers.current['inlandFerries'].setZIndex(8);
    }
  }, [ferries]);

  const loadFerries = async (route) => {
    const newRouteTimestamp = route ? route.searchTimestamp : null;

    // Fetch data if it doesn't already exist or route was updated
//    if (!ferries || (ferriesTimeStamp != newRouteTimestamp)) {
      dispatch(updateFerries({
        list: await getFerries(route ? route.points : null),
        routeTimeStamp: route ? route.searchTimestamp : null,
      }));
//    }
  }

  const loadData = () => {
    if (selectedRoute && selectedRoute.routeFound) {
      const routeLayer = getRouteLayer(selectedRoute, mapRef.current.getView().getProjection().getCode());
      mapLayers.current['routeLayer'] = routeLayer;
      mapRef.current.addLayer(routeLayer);

      // Clear and update data
      loadCameras(selectedRoute);
      loadEvents(selectedRoute);
      loadFerries();

      // Zoom/pan to route
      fitMap(selectedRoute.route, mapView);

    } else {
      // Clear and update data
      loadCameras();
      loadEvents(null);
      loadFerries();
    }
  }

  function closePopup() {
    popup.current.setPosition(undefined);
    if (event !== null) return;

    // check for active camera icons
    if (clickedCameraRef.current) {
      clickedCameraRef.current.setStyle(cameraStyles['static']);
      clickedCameraRef.current.set('clicked', false);
      updateClickedCamera(null);
    }

    // check for active event icons
    if (clickedEventRef.current) {
      clickedEventRef.current.setStyle(
        getEventIcon(clickedEventRef.current, 'static'),
      );
      clickedEventRef.current.set('clicked', false);

      // Set associated line/point feature
      const altFeature = clickedEventRef.current.getProperties()['altFeature'];
      if (altFeature) {
        altFeature.setStyle(
          getEventIcon(altFeature, 'static'),
        );

        altFeature.set('clicked', false);
      }

      updateClickedEvent(null);
    }

    // check for active ferry icons
    if (clickedFerryRef.current) {
      clickedFerryRef.current.setStyle(ferryStyles['static']);
      clickedFerryRef.current.set('clicked', false);
      updateClickedFerry(null);
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
            centerMap([longitude, latitude]);
            setLocationPin([longitude, latitude], redLocationMarkup, mapRef);

          } else {
            // set my location to the center of BC for users outside of BC
            centerMap([-126.5, 54.2]);
            setLocationPin([-126.5, 54.2], redLocationMarkup, mapRef);
          }
        },
        error => {
          console.error('Error getting user location:', error);

          // Zoom out and center to BC if location not available
          setZoomPan(mapView, 7, fromLonLat([-126.5, 54.2]));
        },
      );
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
    if(isPreview || camera){
      return 12
    }
    else{
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

  return (
    <div className="map-container">
      <div ref={mapElement} className="map">
        <div className="map-btn zoom-btn">
          <Button className="zoom-in" variant="primary" aria-label="zoom in"
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

        {!isPreview && (
          <Button
            className="map-btn my-location"
            variant="primary"
            onClick={toggleMyLocation}
            aria-label="my location">
            <FontAwesomeIcon icon={faLocationCrosshairs} />
            My location
          </Button>
        )}
      </div>

      <div id="popup" className="ol-popup">
        <FontAwesomeIcon
          id="ol-popup-closer"
          className="ol-popup-closer"
          icon={faXmark}
          onClick={closePopup}
        />
        <div id="popup-content" className="ol-popup-content">
          {clickedCamera &&
            <CamPopup
              camFeature={clickedCamera}
              isPreview={isPreview} />
          }

          {clickedEvent &&
            getEventPopup(clickedEvent)
          }

          {clickedFerry &&
            getFerryPopup(clickedFerry)
          }
        </div>
      </div>

      <Filters
        toggleHandler={toggleLayer}
      />

      {isPreview && (
        <Button
          className="map-btn map-view"
          variant="primary"
          onClick={mapViewRoute}>
          <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
          Map View
        </Button>
      )}

      {isPreview && (
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

      {!isPreview && (
        <div>
          <RouteSearch />
          <AdvisoriesAccordion />
        </div>
      )}
    </div>
  );
}
