// React
import React, { useRef, useEffect, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMinus,
  faXmark,
  faFlag,
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';

// Internal imports
import {
  zoomIn,
  zoomOut
} from '../map/helpers';
import { get } from '../data/helper';
import { redLocationMarkup, setLocationPin, setZoomPan } from '../map/helpers';

// OpenLayers
import { applyStyle } from 'ol-mapbox-style';
import { defaults } from 'ol/control.js';
import { fromLonLat, transform } from 'ol/proj';
import { ImageWMS, Vector as VectorSource } from 'ol/source.js';
import { Image as ImageLayer, Vector as VectorLayer } from 'ol/layer.js';
import { Polygon } from 'ol/geom';
import * as ol from 'ol';
import Map from 'ol/Map.js';
import MVT from 'ol/format/MVT.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View.js';

// Styling
import './ReportMap.scss';

/* Map loading function */
function loadReportMap(setActiveFeature) {
  const tileLayer = new VectorTileLayer({
    declutter: true,
    source: new VectorTileSource({
      format: new MVT(),
      url: window.BASE_MAP,
    }),
  });

  const imageLayer = new ImageLayer({
    opacity: 0.5,
    visible: true,
    source: new ImageWMS({
      url: "https://maps.th.gov.bc.ca/geoV05/ows",
      params: {
        LAYERS: "hwy:DSA_CONTRACT_AREA_INFO_V"
      },
      transition: 0
    })
  });

  const vectorLayer = new VectorLayer({
    source: new VectorSource()
  });

  // Apply the basemap style from the arcgis resource
  fetch(window.MAP_STYLE, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  }).then(function(response) {
    response.json().then(function(glStyle) {
      // DBC22-2153
      glStyle.metadata['ol:webfonts'] = '/fonts/{font-family}/{fontweight}{-fontstyle}.css';
      applyStyle(tileLayer, glStyle, 'esri');
    });
  });

  const mapViewObj = new View({
    // Centered on BC
    center: transform([-124.96192403748039, 54.55105426844414], 'EPSG:4326', 'EPSG:3857'),
    zoom: 5,
  });

  const newMap = new Map({
    target: 'report-map',
    layers: [
      tileLayer,
      imageLayer,
      vectorLayer
    ],
    view: mapViewObj,
    controls: defaults({attribution: false, zoom: false}),
  });

  // Register click listener
  newMap.on('click', async e => {
    clickListener(newMap, newMap.getPixelFromCoordinate(e.coordinate), setActiveFeature);
  });

  return newMap;
}

/* Click listener */
const clickListener = (map, pixelCoords, setActiveFeature) => {
  const payload = {
    request: 'GetFeatureInfo',
    service: 'WMS',
    srs: 'EPSG:3857',
    styles: '',
    transparent: true,
    version: '1.1.1',
    format: 'image/png',
    bbox: map.getView().calculateExtent(map.getSize()).join(','),
    width: map.getSize()[0],
    height: map.getSize()[1],
    x: Math.floor(pixelCoords[0]),
    y: Math.floor(pixelCoords[1]),
    layers: 'hwy:DSA_CONTRACT_AREA_INFO_V',
    query_layers: 'hwy:DSA_CONTRACT_AREA_INFO_V',
    info_format: 'application/json',
    feature_count: 1
  };

  get('https://maps.th.gov.bc.ca/geoV05/ows', payload).then((data) => setActiveFeature(data.features[0]));
}

export function ReportMap() {
  /* Refs */
  const isInitialMount = useRef(true);
  const mapRef = useRef();
  const mapView = useRef();
  const panel = useRef();

  /* States */
  const [activeFeature, setActiveFeature] = useState(null);

  /* Data function and initialization */
  const loadMap = () => {
    // Run once on startup
    if (isInitialMount.current){
      mapRef.current = loadReportMap(setActiveFeature);
      mapView.current = mapRef.current.getView();
      toggleMyLocation(mapRef, mapView);
    }

    isInitialMount.current = false;
  };

  useEffect(() => {
    loadMap();
  });

  useEffect(() => {
    if (mapRef.current) {
      // Get the active layer
      const layers = mapRef.current.getLayers().getArray();
      const activeLayer = layers[layers.length-1];

      // Clear all active features
      activeLayer.getSource().clear();

      if (activeFeature) {
        // Add the new feature
        const newFeature = new ol.Feature({
          geometry: new Polygon(activeFeature.geometry.coordinates)
        });

        activeLayer.getSource().addFeature(newFeature);
      }
    }
  }, [activeFeature]);

  /* My location */
  const toggleMyLocation = (mapRef, mapView) => {
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
            const mapCoords = fromLonLat([longitude, latitude]);

            setZoomPan(mapView, 9, mapCoords);
            setLocationPin([longitude, latitude], redLocationMarkup, mapRef);

            // Wait for map to pan before getting pixel coords
            setTimeout(() => {
              const pixelCoords = mapRef.current.getPixelFromCoordinate(mapCoords);

              clickListener(mapRef.current, pixelCoords, setActiveFeature);
            }, 1000);

          } else {
            // set my location to the center of BC for users outside of BC
            setZoomPan(mapView, 9, fromLonLat([-126.5, 54.2]));
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

  /* Panel functions */
  const maximizePanel = (panelRef) => {
    if (panelRef.current.classList.contains('open') &&
        !panelRef.current.classList.contains('maximized')) {
      panelRef.current.classList.add('maximized');
    }
  }

  const renderPanel = () => {
    return (
      <div className="popup popup--advisories" tabIndex={0}>
        <div className="popup__title">
          <div className="popup__title__icon">
            <FontAwesomeIcon icon={faFlag} />
          </div>
          <p className="name">{activeFeature.properties.CONTRACT_AREA_PUBLIC_NAME}</p>
          <p className="name">Service Area {activeFeature.properties.CONTRACT_AREA_NUMBER}</p>
        </div>
        <div className="popup__content">
          <p>Please be prepared to describe the highway problem and location to our maintenance contractor.</p>
          <p>You will be talking to:</p>
          <p>{activeFeature.properties.CONTRACTOR1_NAME}</p>
          <p>{activeFeature.properties.CONTRACTOR1_CONTACT}</p>
          <p>Thank you for bringing this issue to our attention.</p>
        </div>
      </div>
    );
  }

  /* Constants for conditional rendering */
  const openPanel = !!activeFeature;

  return (
    <Container className="report-map-container">
      <div
        ref={panel}
        className={`side-panel ${openPanel ? 'open' : ''}`}
        onClick={() => maximizePanel(panel)}
        onTouchMove={() => maximizePanel(panel)}
        onKeyDown={keyEvent => {
          if (keyEvent.keyCode == 13) {
            maximizePanel(panel);
          }
        }}>
        <span id="button-close-side-panel-label" aria-hidden="false" hidden>close side panel</span>
        <button
          className="close-panel"
          aria-label={`${openPanel ? 'close side panel' : ''}`}
          aria-labelledby="button-close-side-panel-label"
          aria-hidden={`${openPanel ? false : true}`}
          tabIndex={`${openPanel ? 0 : -1}`}
          onClick={() => setActiveFeature(false)}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="panel-content">
          {openPanel && renderPanel()}
        </div>
      </div>

      <div id="report-map" className="report-map"></div>

      <div className="zoom-btn">
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
    </Container>
  );
}
