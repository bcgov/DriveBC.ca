// React
import React, { useContext, useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { updateMapState } from '../slices/mapSlice';
import { useNavigate } from 'react-router-dom';

// Third party packages
import Button from 'react-bootstrap/Button';

// FA
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMinus,
  faUpRightAndDownLeftFromCenter,
  faLocationCrosshairs,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

// Components and functions
import { getCamerasLayer } from './map/layers/camerasLayer.js';
import { getCamPopup, getEventPopup, getFerryPopup } from './map/mapPopup.js'
import { getEvents } from './data/events.js';
import { getEventsLayer } from './map/layers/eventsLayer.js';
import {
  fitMap,
  getCameraCircle,
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
import { getWebcams, groupCameras } from './data/webcams.js';
import { getRouteLayer } from './map/routeLayer.js';
import { MapContext } from '../App.js';
import AdvisoriesAccordion from './advisories/AdvisoriesAccordion';
import CurrentCameraIcon from './CurrentCameraIcon';
import Layers from './Layers.js';
import RouteSearch from './map/RouteSearch.js';

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
}) {
  // Redux
  const dispatch = useDispatch();
  const [ searchLocationFrom, selectedRoute, zoom, pan ] = useSelector((state) => [
    state.routes.searchLocationFrom,
    state.routes.selectedRoute,
    state.map.zoom,
    state.map.pan
  ]);

  // Context
  const { mapContext, setMapContext } = useContext(MapContext);

  // Refs
  const mapElement = useRef();
  const mapRef = useRef();
  const popup = useRef();
  const layers = useRef({});
  const mapView = useRef();
  const container = useRef();
  const geolocation = useRef(null);
  const hoveredCamera = useRef();
  const hoveredEvent = useRef();
  const hoveredFerry = useRef();
  const locationPinRef = useRef(null);
  const cameraPopupRef = useRef(null);

  // States
  const [layersOpen, setLayersOpen] = useState(false);

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
        url: `${process.env.REACT_APP_BASE_MAP}`,
      }),
    });

    const { circle, radiusLayer } = getCameraCircle(camera);

    // initialize starting optional layers
    layers.current = {
      tid: Date.now(),
    };

    // Set map extent
    const extent = [-143.23013896362576, 65.59132385849652, -109.97743701256154, 46.18015377362468];
    const transformedExtent = transformExtent(extent,'EPSG:4326','EPSG:3857');

    mapView.current = new View({
      projection: 'EPSG:3857',
      constrainResolution: true,
      center: camera ? handleCenter() : fromLonLat(pan),
      zoom: isPreview ? 12 : zoom,
      maxZoom: 15,
      extent: transformedExtent
    });

    // Apply the basemap style from the arcgis resource
    fetch(`${process.env.REACT_APP_MAP_STYLE}`, {
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
      layers: radiusLayer
        ? [
            vectorLayer,
            radiusLayer,
          ]
        : [
            vectorLayer,
          ],
      overlays: [popup.current],
      view: mapView.current,
      controls: [new ScaleLine({ units: 'metric' })],
    });

    geolocation.current = new Geolocation({
      projection: mapView.current.getProjection(),
    });

    mapRef.current.once('loadend', () => {
      if (!selectedRoute) {
        loadCameras();
        loadEvents();
      }
    });

    mapRef.current.on('moveend', function () {
      dispatch(updateMapState({pan: toLonLat(mapView.current.getCenter()), zoom: mapView.current.getZoom()}))
    });

    // Click states
    const resetClickedStates = (clickedFeature) => {
      if (clickedCameraRef.current && clickedFeature != clickedCameraRef.current) {
        clickedCameraRef.current.setStyle(cameraStyles['static']);
        updateClickedCamera(null);
      }

      if (clickedEventRef.current && clickedFeature != clickedEventRef.current) {
        clickedEventRef.current.setStyle(
          getEventIcon(clickedEventRef.current, 'static'),
        );

        setRelatedGeometry(clickedEventRef.current, 'static');
        updateClickedEvent(null);
      }

      if (clickedFerryRef.current && clickedFeature != clickedFerryRef.current) {
        clickedFerryRef.current.setStyle(ferryStyles['static']);
        updateClickedFerry(null);
      }
    }

    const camClickHandler = (feature) => {
      const camData = feature.getProperties();
      if (isPreview) {
        // Only switch context on clicking cameras within circle
        if (circle &&
          circle.intersectsCoordinate(fromLonLat(camData.location.coordinates))
        ) {
          mapView.current.animate({
            center: fromLonLat(camData.location.coordinates),
          });

          cameraHandler(camData);
        }

      } else {
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
    }

    const eventClickHandler = (feature) => {
      // reset previous clicked feature
      resetClickedStates(feature);

      // set new clicked event feature
      feature.setStyle(
        getEventIcon(feature, 'active'),
      );
      setRelatedGeometry(feature, 'active');
      feature.setProperties({ clicked: true }, true);
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
      // check if it was a webcam icon that was clicked
      const camFeatures = layers.current.webcamsLayer.getVisible() ?
       await layers.current.webcamsLayer.getFeatures(e.pixel) : [];

      if (camFeatures.length) {
        camClickHandler(camFeatures[0]);
        return;
      }

      // if it wasn't a webcam icon, check if it was an event
      const eventFeatures = layers.current.eventsLayer.getVisible() ?
        await layers.current.eventsLayer.getFeatures(e.pixel) : [];

      if (eventFeatures.length) {
        eventClickHandler(eventFeatures[0]);
        return;
      }

      // if it wasn't a event icon, check if it was a ferry
      const ferryFeatures = layers.current.ferriesLayer.getVisible() ?
        await layers.current.ferriesLayer.getFeatures(e.pixel) : [];

      if (ferryFeatures.length) {
        ferryClickHandler(ferryFeatures[0]);
        return;
      }

      // Close popups if clicked on blank space
      closePopup();
    });

    // Hover states
    const resetHoveredStates = (hoveredFeature) => {
      if (hoveredCamera.current && hoveredFeature != hoveredCamera.current) {
        if (!hoveredCamera.current.getProperties().clicked) {
          hoveredCamera.current.setStyle(cameraStyles['static']);
        }

        hoveredCamera.current = null;
      }

      if (hoveredEvent.current && hoveredFeature != hoveredEvent.current) {
        if (!hoveredEvent.current.getProperties().clicked) {
          hoveredEvent.current.setStyle(
            getEventIcon(hoveredEvent.current, 'static'),
          );
          setRelatedGeometry(hoveredEvent.current, 'static');
        }
        hoveredEvent.current = null;
      }

      if (hoveredFerry.current && hoveredFeature != hoveredFerry.current) {
        if (!hoveredFerry.current.getProperties().clicked) {
          hoveredFerry.current.setStyle(ferryStyles['static']);
        }

        hoveredFerry.current = null;
      }
    }

    mapRef.current.on('pointermove', async (e) => {
      if (layers.current && 'webcamsLayer' in layers.current) {
        // check if it was a camera icon that was hovered on
        const hoveredCameras = await layers.current['webcamsLayer'].getFeatures(e.pixel);
        if (hoveredCameras.length) {
          const feature = hoveredCameras[0];

          resetHoveredStates(feature);

          hoveredCamera.current = feature;
          if (!hoveredCamera.current.getProperties().clicked) {
            hoveredCamera.current.setStyle(cameraStyles['hover']);
          }

          return;
        }
      }

      // if it wasn't a camera icon, check if it was an event
      if (layers.current && 'eventsLayer' in layers.current) {
        const hoveredEvents = await layers.current['eventsLayer'].getFeatures(e.pixel);
        if (hoveredEvents.length) {
          const feature = hoveredEvents[0];

          resetHoveredStates(feature);

          hoveredEvent.current = feature;
          if (!hoveredEvent.current.getProperties().clicked) {
            hoveredEvent.current.setStyle(
              getEventIcon(hoveredEvent.current, 'hover'),
            );
            setRelatedGeometry(hoveredEvent.current, 'hover');
          }

          return;
        }
      }

      // if it wasn't a event icon, check if it was a ferry
      if (layers.current && 'ferriesLayer' in layers.current) {
        // check if it was a camera icon that was hovered on
        const hoveredFerries = await layers.current['ferriesLayer'].getFeatures(e.pixel);
        if (hoveredFerries.length) {
          const feature = hoveredFerries[0];

          resetHoveredStates(feature);

          hoveredFerry.current = feature;
          if (!hoveredFerry.current.getProperties().clicked) {
            hoveredFerry.current.setStyle(ferryStyles['hover']);
          }

          return;
        }
      }

      // Reset on blank space
      resetHoveredStates(null);
    });

    toggleMyLocation();
  }, []);

  useEffect(() => {
    if (searchLocationFrom && searchLocationFrom.length) {
      if (locationPinRef.current) {
        mapRef.current.removeOverlay(locationPinRef.current);
      }
      centerMap(searchLocationFrom[0].geometry.coordinates);
      setLocationPin(
        searchLocationFrom[0].geometry.coordinates,
        blueLocationMarkup,
        mapRef,
        locationPinRef
      );
    }
  }, [searchLocationFrom]);

  useEffect(() => {
    if (layers.current['routeLayer']) {
      mapRef.current.removeLayer(layers.current['routeLayer']);
    }

    if (selectedRoute && selectedRoute.routeFound) {
      const routeLayer = getRouteLayer(selectedRoute, mapRef.current.getView().getProjection().getCode());
      layers.current['routeLayer'] = routeLayer;
      mapRef.current.addLayer(routeLayer);

      loadEvents(selectedRoute.points);
      loadCameras(selectedRoute.points);
      loadFerries();

      fitMap(selectedRoute.route, mapView);

    } else {
      loadEvents();
      loadCameras();
      loadFerries();
    }
  }, [selectedRoute]);

  useEffect(() => {
    console.log("Zoom level: " + Math.round(mapRef.current.getView().getZoom()));
  });

  async function loadCameras(route) {
    const webcamResults = await getWebcams(route);

    if (layers.current['webcamsLayer']) {
      mapRef.current.removeLayer(layers.current['webcamsLayer']);
    }

    layers.current['webcamsLayer'] = getCamerasLayer(
      groupCameras(webcamResults),
      mapRef.current.getView().getProjection().getCode(),
      mapContext
    )

    mapRef.current.addLayer(layers.current['webcamsLayer']);
    layers.current['webcamsLayer'].setZIndex(1);
  }

  async function loadEvents(route) {
    const eventsData = await getEvents(route);

    if (layers.current['eventsLayer']) {
      mapRef.current.removeLayer(layers.current['eventsLayer']);
    }

    layers.current['eventsLayer'] = getEventsLayer(
      eventsData,
      mapRef.current.getView().getProjection().getCode(),
      mapContext
    )

    mapRef.current.addLayer(layers.current['eventsLayer']);
  }

  async function loadFerries() {
    const ferriesData = await getFerries();

    if (layers.current['ferriesLayer']) {
      mapRef.current.removeLayer(layers.current['ferriesLayer']);
    }

    layers.current['ferriesLayer'] = getFerriesLayer(
      ferriesData,
      mapRef.current.getView().getProjection().getCode(),
      mapContext
    )

    mapRef.current.addLayer(layers.current['ferriesLayer']);
  }

  function closePopup() {
    popup.current.setPosition(undefined);
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
      setRelatedGeometry(clickedEventRef.current, 'static');
      clickedEventRef.current.set('clicked', false);
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

  const setRelatedGeometry = (event, state) => {
    if (event.getId()) {
      const relatedFeature = layers.current['eventsLayer']
        .getSource()
        .getFeatureById(event.ol_uid);
      relatedFeature.setStyle(getEventIcon(relatedFeature, state));
    }
  };

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

  function toggleLayers(openLayers) {
    setLayersOpen(openLayers);
  }

  function toggleLayer(layer, checked) {
    layers.current[layer].setVisible(checked);

    // Set context and local storage
    mapContext.visible_layers[layer] = checked;
    setMapContext(mapContext);
    localStorage.setItem('mapContext', JSON.stringify(mapContext));
  }

  return (
    <div className="map-container">
      <div ref={mapElement} className="map">
        <div className="zoom-btn">
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
            getCamPopup(clickedCamera, updateClickedCamera, navigate, cameraPopupRef)
          }

          {clickedEvent &&
            getEventPopup(clickedEvent)
          }

          {clickedFerry &&
            getFerryPopup(clickedFerry)
          }
        </div>
      </div>

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
              setZoomPan(mapView, null, fromLonLat(camera.location.coordinates));
            }
          }}>
          <CurrentCameraIcon />
          Camera location
        </Button>
      )}

      {!isPreview && (
        <div>
          <RouteSearch />

          <Layers
            open={layersOpen}
            setLayersOpen={toggleLayers}
            toggleLayer={toggleLayer}
          />
          <AdvisoriesAccordion />
        </div>
      )}
    </div>
  );
}
