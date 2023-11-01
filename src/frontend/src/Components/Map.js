// React
import React, { useContext, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { updateMapState } from '../slices/mapSlice';

// Third party packages
import { lineString, bbox } from "@turf/turf";
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
import { getCamPopup, getEventPopup } from './map/mapPopup.js'
import { getEvents } from './data/events.js';
import { getEventsLayer } from './map/layers/eventsLayer.js';
import { getEventIcon } from './map/helper.js';
import { getWebcams } from './data/webcams.js';
import { getRouteLayer } from './map/routeLayer.js';
import { MapContext } from '../App.js';
import AdvisoriesAccordion from './advisories/AdvisoriesAccordion';
import CurrentCameraIcon from './CurrentCameraIcon';
import Layers from './Layers.js';
import RouteSearch from './map/RouteSearch.js';

// OpenLayers
import { applyStyle } from 'ol-mapbox-style';
import { Circle } from 'ol/geom.js';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { ScaleLine } from 'ol/control.js';
import { Style } from 'ol/style.js';
import Feature from 'ol/Feature.js';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay.js';
import Geolocation from 'ol/Geolocation.js';
import MVT from 'ol/format/MVT.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View';

// Styling
import { cameraStyles } from './data/eventStyleDefinitions.js';
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
  const content = useRef();
  const geolocation = useRef(null);
  const hoveredCamera = useRef();
  const hoveredEvent = useRef();
  const clickedCamera = useRef();
  const clickedEvent = useRef();
  const locationPinRef = useRef(null);

  // States
  const [iconClicked, setIconClicked] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);

  // Misc
  const navigate = useNavigate();

  function centerMap(coordinates) {
    if (mapView.current) {
      mapView.current.animate({
        center: fromLonLat(coordinates),
      });
    }
  }

  function fitMap() {
    const routeBbox = bbox(lineString(selectedRoute.route));
    const routeExtent = transformExtent(routeBbox,'EPSG:4326','EPSG:3857');

    if (mapView.current) {
      mapView.current.fit(routeExtent, { duration: 1000 });
    }
  }

  function setLocationPinPoint(coordinates) {
    const svgMarkup = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg" id="svg-container">
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="40%" style="stop-color:#f32947;stop-opacity:0.5" />
            <stop offset="40%" style="stop-color:#ed6f82;stop-opacity:0.5" />
          </linearGradient>
        </defs>
        <circle id="circle1" cx="44" cy="44" r="44" fill="url(#gradient1)"/>
        <defs>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="100%" style="stop-color:#f32947;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ed6f82;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="44" cy="44" r="16" fill="url(#gradient2)" stroke="white" stroke-width="2" />
      </svg>
    `;

    const svgImage = new Image();
    svgImage.src =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);

    // Create an overlay for the marker
    locationPinRef.current = new Overlay({
      position: fromLonLat(coordinates),
      positioning: 'bottom-center',
      element: svgImage,
      stopEvent: false, // Allow interactions with the overlay content
    });

    mapRef.current.addOverlay(locationPinRef.current);
    mapRef.current.on('moveend', function (event) {
      const newZoom = mapRef.current.getView().getZoom();
      // Calculate new marker size based on the zoom level
      const newSize = 44 * (newZoom / 10);
      svgImage.style.width = newSize + 'px';
      svgImage.style.height = newSize + 'px';
    });
  }

  function addMyLocationPinPoint(coordinates) {
    const svgMarkup = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg" id="svg-container">
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="40%" style="stop-color:#2790F3;stop-opacity:0.5" />
            <stop offset="40%" style="stop-color:#7496EC;stop-opacity:0.5" />
          </linearGradient>
        </defs>
        <circle id="circle1" cx="44" cy="44" r="44" fill="url(#gradient1)"/>
        <defs>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="100%" style="stop-color:#2970F3;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#7496EC;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="44" cy="44" r="16" fill="url(#gradient2)" stroke="white" stroke-width="2" />
      </svg>
    `;

    const svgImage = new Image();
    svgImage.src =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);

    // Create an overlay for the marker
    const markerOverlay = new Overlay({
      position: fromLonLat(coordinates),
      positioning: 'bottom-center',
      element: svgImage,
      stopEvent: false, // Allow interactions with the overlay content
    });

    mapRef.current.on('moveend', function (event) {
      const newZoom = mapRef.current.getView().getZoom();
      // Calculate new marker size based on the zoom level
      const newSize = 44 * (newZoom / 10);
      svgImage.style.width = newSize + 'px';
      svgImage.style.height = newSize + 'px';
      mapRef.current.addOverlay(markerOverlay);
    });
  }

  function getCameraCircle(camera) {
    if (!camera) {
      return {};
    }

    if (typeof camera === 'string') {
      camera = JSON.parse(camera);
    }
    const circle = new Circle(fromLonLat(camera.location.coordinates), 5000);
    const circleFeature = new Feature({
      geometry: circle,
    });

    circleFeature.setStyle(
      new Style({
        renderer(coordinates, state) {
          const [[x, y], [x1, y1]] = coordinates;
          const ctx = state.context;
          const dx = x1 - x;
          const dy = y1 - y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          const innerRadius = 0;
          const outerRadius = radius * 1.4;

          const gradient = ctx.createRadialGradient(
            x,
            y,
            innerRadius,
            x,
            y,
            outerRadius,
          );
          gradient.addColorStop(0, 'rgba(255,0,0,0)');
          gradient.addColorStop(0.6, 'rgba(255,0,0,0.2)');
          gradient.addColorStop(1, 'rgba(255,0,0,0.8)');
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
          ctx.strokeStyle = 'rgba(255,0,0,1)';
          ctx.stroke();
        },
      }),
    );

    const radiusLayer = new VectorLayer({
      source: new VectorSource({
        features: [circleFeature],
      }),
    });

    return {
      circle: circle,
      radiusLayer: radiusLayer,
    };
  }

  useEffect(() => {
    // initialization hook for the OpenLayers map logic
    if (mapRef.current) return; // stops map from intializing more than once

    container.current = document.getElementById('popup');
    content.current = document.getElementById('popup-content');

    popup.current = new Overlay({
      element: container.current,
      autoPan: {
        animation: {
          duration: 250,
        },
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
      zoom: zoom,
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
      if (clickedCamera.current && clickedFeature != clickedCamera.current) {
        clickedCamera.current.setStyle(cameraStyles['static']);
        clickedCamera.current = null;
      }

      if (clickedEvent.current && clickedFeature != clickedEvent.current) {
        clickedEvent.current.setStyle(
          getEventIcon(clickedEvent.current, 'static'),
        );

        setRelatedGeometry(clickedEvent.current, 'static');
        clickedEvent.current = null;
      }
    }

    mapRef.current.on('click', async (e) => {
      setIconClicked(false);

      // check if it was a webcam icon that was clicked
      const camFeatures = await layers.current['webcamsLayer'].getFeatures(e.pixel);
      if (camFeatures.length) {
        const featureDetails = camFeatures[0].getProperties().features[0].getProperties();
        if (isPreview) {
          // Only switch context on clicking cameras within circle
          if (circle &&
            circle.intersectsCoordinate(fromLonLat(featureDetails.location.coordinates))
          ) {
            mapView.current.animate({
              center: fromLonLat(featureDetails.location.coordinates),
            });

            cameraHandler(featureDetails);
          }

        } else {
          setIconClicked(true);

          const feature = camFeatures[0];

          resetClickedStates(feature);

          // set new clicked camera feature
          clickedCamera.current = feature;
          clickedCamera.current.setStyle(cameraStyles['active']);
          clickedCamera.current.setProperties({ clicked: true }, true);

          content.current.innerHTML = getCamPopup(featureDetails);

          popup.current.setPosition(
            clickedCamera.current.getGeometry().getCoordinates(),
          );
          popup.current.getElement().style.top = '40px';
        }
      } else {
        setIconClicked(true);

        // if it wasn't a webcam icon, check if it was an event
        const eventFeatures = await layers.current['eventsLayer'].getFeatures(e.pixel);
        if (eventFeatures.length) {
          const feature = eventFeatures[0];

          // reset previous clicked feature
          resetClickedStates(feature);

          // set new clicked event feature
          clickedEvent.current = feature;
          clickedEvent.current.setStyle(
            getEventIcon(clickedEvent.current, 'active'),
          );
          setRelatedGeometry(clickedEvent.current, 'active');

          clickedEvent.current.setProperties({ clicked: true }, true);

          content.current.innerHTML = getEventPopup(feature);

          popup.current.setPosition(
            clickedEvent.current.getGeometry().getCoordinates(),
          );
          popup.current.getElement().style.top = '40px';

        } else {
          // if neither, hide any existing popup
          if (iconClicked === false) {
            closePopup();
          }
        }
      }
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
    }

    mapRef.current.on('pointermove', async (e) => {
      let camHit = false;
      if (layers.current && 'webcamsLayer' in layers.current) {
        // check if it was a camera icon that was hovered on
        const hoveredCameras = await layers.current['webcamsLayer'].getFeatures(e.pixel);
        if (hoveredCameras.length) {
          camHit = true;

          const feature = hoveredCameras[0];

          resetHoveredStates(feature);

          hoveredCamera.current = feature;
          if (!hoveredCamera.current.getProperties().clicked) {
            hoveredCamera.current.setStyle(cameraStyles['hover']);
          }
        }
      }

      // if it wasn't a camera icon, check if it was an event
      let eventHit = false;
      if (layers.current && 'eventsLayer' in layers.current && !camHit) {
        const hoveredEvents = await layers.current['eventsLayer'].getFeatures(e.pixel);
        if (hoveredEvents.length) {
          eventHit = true;

          const feature = hoveredEvents[0];

          resetHoveredStates(feature);

          hoveredEvent.current = feature;
          if (!hoveredEvent.current.getProperties().clicked) {
            hoveredEvent.current.setStyle(
              getEventIcon(hoveredEvent.current, 'hover'),
            );
            setRelatedGeometry(hoveredEvent.current, 'hover');
          }
        }
      }

      if (!camHit && !eventHit) {
        resetHoveredStates(null);
      }
    });
  }, []);

  useEffect(() => {
    if (searchLocationFrom && searchLocationFrom.length) {
      if (locationPinRef.current) {
        mapRef.current.removeOverlay(locationPinRef.current);
      }
      centerMap(searchLocationFrom[0].geometry.coordinates);
      setLocationPinPoint(searchLocationFrom[0].geometry.coordinates);
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

      loadEvents(selectedRoute.route);
      loadCameras(selectedRoute.route);

      fitMap();

    } else {
      loadEvents();
      loadCameras();
    }
  }, [selectedRoute]);

  async function loadCameras(route) {
    const webcamResults = await getWebcams(route);

    if (layers.current['webcamsLayer']) {
      mapRef.current.removeLayer(layers.current['webcamsLayer']);
    }

    layers.current['webcamsLayer'] = getCamerasLayer(
      webcamResults,
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

    // Events iterator
    layers.current['eventsLayer'] = getEventsLayer(
      eventsData,
      mapRef.current.getView().getProjection().getCode(),
      mapContext
    )

    mapRef.current.addLayer(layers.current['eventsLayer']);
  }

  function cameraDetailRoute() {
    // setting geometry to null so that the object may be passed
    if (clickedCamera.current) {
      clickedCamera.current.geometry = null;

      const camProps = clickedCamera.current.getProperties().features[0].getProperties();
      navigate(`/cameras/${camProps.id}`);
    }
  }

  function closePopup() {
    popup.current.setPosition(undefined);
    // check for active camera icons
    if (clickedCamera.current) {
      clickedCamera.current.setStyle(cameraStyles['static']);
      clickedCamera.current.set('clicked', false);
      clickedCamera.current = null;
    }
    // check for active event icons
    if (clickedEvent.current) {
      clickedEvent.current.setStyle(
        getEventIcon(clickedEvent.current, 'static'),
      );
      setRelatedGeometry(clickedEvent.current, 'static');
      clickedEvent.current.set('clicked', false);
      clickedEvent.current = null;
    }
    setIconClicked(false);
  }

  const setRelatedGeometry = (event, state) => {
    if (event.getId()) {
      const relatedFeature = layers.current['eventsLayer']
        .getSource()
        .getFeatureById(event.ol_uid);
      relatedFeature.setStyle(getEventIcon(relatedFeature, state));
    }
  };

  function zoomIn() {
    if (!mapRef.current) {
      return;
    }
    const view = mapRef.current.getView();
    view.animate({
      zoom: view.getZoom() + 1,
      duration: 250,
    });
  }

  function zoomOut() {
    if (!mapRef.current) {
      return;
    }
    const view = mapRef.current.getView();
    view.animate({
      zoom: view.getZoom() - 1,
      duration: 250,
    });
  }

  function handleRecenter() {
    // TODO: reimpliment this in OpenLayers
    if (camera) {
      mapView.current.animate({
        center: fromLonLat(camera.location.coordinates),
      });
      return;
    }
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
            addMyLocationPinPoint([longitude, latitude]);
          } else {
            // set my location to the center of BC for users outside of BC
            centerMap([-126.5, 54.2]);
            addMyLocationPinPoint([-126.5, 54.2]);
          }
        },
        error => {
          console.error('Error getting user location:', error);
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
          <Button className="zoom-in" variant="primary" onClick={zoomIn} aria-label="zoom in">
            <FontAwesomeIcon icon={faPlus} />
          </Button>
          <div className="zoom-divider" />
          <Button
            className="zoom-out"
            variant="primary"
            onClick={zoomOut}
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

      <div id="popup" onClick={cameraDetailRoute} className="ol-popup">
        <FontAwesomeIcon
          id="ol-popup-closer"
          className="ol-popup-closer"
          icon={faXmark}
          onClick={closePopup}
        />
        <div id="popup-content" className="ol-popup-content"></div>
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
          onClick={handleRecenter}>
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
