// React
import React, { useRef, useEffect, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationCrosshairs,
  faPlus,
  faMinus,
  faXmark,
  faBridge,
  faPlug,
  faPhone,
  faUpRightAndDownLeftFromCenter,
  faMinimize,
} from '@fortawesome/pro-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import { useMediaQuery } from '@uidotdev/usehooks';

// Internal imports
import { zoomIn, zoomOut } from '../map/helpers';
import { get } from '../data/helper';
import { redLocationMarkup, setLocationPin, setZoomPan } from '../map/helpers';
import overrides from '../map/overrides.js';

// OpenLayers
import { applyStyle } from 'ol-mapbox-style';
import { defaults } from 'ol/control.js';
import { fromLonLat, transform, transformExtent } from 'ol/proj';
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
function loadReportMap(setActiveFeature, wmsLayer, styles, smallScreen) {
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
      url: window.REPORT_WMS_LAYER,
      params: {
        LAYERS: wmsLayer,
        STYLES: styles,
      },
      transition: 0,
    }),
  });

  const vectorLayer = new VectorLayer({
    source: new VectorSource(),
  });

  // Apply the basemap style from the arcgis resource
  fetch(window.MAP_STYLE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).then(function (response) {
    response.json().then(function (glStyle) {
      window.glStyle = glStyle;

      // DBC22-2153
      glStyle.metadata['ol:webfonts'] =
        '/fonts/{font-family}/{fontweight}{-fontstyle}.css';

      // Overrides
      for (const layer of glStyle.layers) {
        overrides.merge(layer, overrides[layer.id] || {});
      }

      applyStyle(tileLayer, glStyle, 'esri');
    });
  });

  // Set map extent (W, S, E, N)
  const extent = [-169.9999311184518, 14.504609139675608, -60.70077056146753, 75.20528693014171];
  const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

  const mapViewObj = new View({
    // Centered on BC
    center: transform(
      [-124.96192403748039, 54.55105426844414],
      'EPSG:4326',
      'EPSG:3857',
    ),
    zoom: smallScreen ? 5: 5.5,
    maxZoom: 15,
    minZoom: 4.1,
    extent: transformedExtent,
  });

  const newMap = new Map({
    target: 'report-map',
    layers: [tileLayer, imageLayer, vectorLayer],
    view: mapViewObj,
    controls: defaults({ attribution: false, zoom: false }),
  });

  // Register click listener
  newMap.on('click', async e => {
    clickListener(
      newMap,
      newMap.getPixelFromCoordinate(e.coordinate),
      setActiveFeature,
      wmsLayer,
    );
  });

  return newMap;
}

/* Click listener */
const clickListener = (map, pixelCoords, setActiveFeature, wmsLayer) => {
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
    layers: wmsLayer,
    query_layers: wmsLayer,
    info_format: 'application/json',
    feature_count: 1,
  };

  get(window.REPORT_WMS_LAYER, payload, {}, false).then(data => {
    setActiveFeature(data.features[0]);
  });
};

export function ReportMap(props) {
  const { wmsLayer, styles } = props;

  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  /* Refs */
  const isInitialMount = useRef(true);
  const mapRef = useRef();
  const mapView = useRef();
  const panel = useRef();

  /* States */
  const [activeFeature, setActiveFeature] = useState(null);
  const [expanded, setExpanded] = useState(false);

  /* Data function and initialization */
  const loadMap = () => {
    // Run once on startup
    if (isInitialMount.current) {
      mapRef.current = loadReportMap(setActiveFeature, wmsLayer, styles, smallScreen);
      mapView.current = mapRef.current.getView();
      toggleMyLocation(mapRef, mapView);
    }

    isInitialMount.current = false;
  };

  // DBC22-2831: mobile Safari vh too large
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);

    return () => {
      window.removeEventListener('resize', setVh);
    };
  }, []);

  useEffect(() => {
    loadMap();
  });

  useEffect(() => {
    if (mapRef.current) {
      // Get the active layer
      const layers = mapRef.current.getLayers().getArray();
      const activeLayer = layers[layers.length - 1];

      // Clear all active features
      activeLayer.getSource().clear();

      if (activeFeature) {
        // Add the new feature
        const newFeature = new ol.Feature({
          geometry: new Polygon(activeFeature.geometry.coordinates),
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

            setZoomPan(mapView, 6.5, mapCoords);
            setLocationPin([longitude, latitude], redLocationMarkup, mapRef);

            // Wait for map to pan before getting pixel coords
            setTimeout(() => {
              const pixelCoords =
                mapRef.current.getPixelFromCoordinate(mapCoords);
              clickListener(
                mapRef.current,
                pixelCoords,
                setActiveFeature,
                wmsLayer,
              );
            }, 1000);

          } else {
            // set my location to the center of BC for users outside of BC
            setZoomPan(mapView, 9, fromLonLat([-126.5, 54.2]));
          }

        }, error => {
          if (error.code === error.PERMISSION_DENIED) {
            // The user has blocked location access
            console.error('Location access denied by user.', error);
          } else {
            // Zoom out and center to BC if location not available
            setZoomPan(mapView, 9, fromLonLat([-126.5, 54.2]));
          }
        }, {
          enableHighAccuracy: false,
          timeout: Infinity,
          maximumAge: 300000  // cache for 5 minutes
        }
      );
    }
  };

  /* Panel functions */
  const maximizePanel = panelRef => {
    if (
      panelRef.current.classList.contains('open') &&
      !panelRef.current.classList.contains('maximized')
    ) {
      panelRef.current.classList.add('maximized');
    }
  };

  const touchDevice = useMediaQuery('(pointer: coarse)');

  const renderPanel = () => {
    return (
      <div className="popup popup--problem" tabIndex={0}>
        <div className="popup__title">
          <div className="popup__title__icon">
            {activeFeature.properties.ELECTRICAL_CA_NAME ? (
              <FontAwesomeIcon icon={faPlug} />
            ) : (
              <FontAwesomeIcon icon={faBridge} />
            )}
          </div>
          <p className="name">Contractor details</p>
        </div>
        <div className="popup__content">
          {activeFeature.properties.CONTRACT_AREA_PUBLIC_NAME && (
            <p className="service-area">
              {activeFeature.properties.CONTRACT_AREA_PUBLIC_NAME}
            </p>
          )}
          {activeFeature.properties.ELECTRICAL_CA_NAME && (
            <p className="service-area">
              {activeFeature.properties.ELECTRICAL_CA_NAME}
            </p>
          )}

          {activeFeature.properties.CONTRACT_AREA_NUMBER && (
            <p className="service-area-number">
              Service Area {activeFeature.properties.CONTRACT_AREA_NUMBER}
            </p>
          )}
          {activeFeature.properties.ELECTRICAL_CA_NUMBER && (
            <p className="service-area-number">
              Service Area {activeFeature.properties.ELECTRICAL_CA_NUMBER}
            </p>
          )}

          <p>
            Please be prepared to describe the highway problem and location to
            our maintenance contractor.
          </p>
          <p>You will be talking to:</p>
          {activeFeature.properties.CONTRACTOR1_CONTACT && (
            <div>
              <div className="contractor-name">
                {activeFeature.properties.CONTRACTOR1_WEBSITE ? (
                  <a
                    href={activeFeature.properties.CONTRACTOR1_WEBSITE}
                    className="website-link"
                    rel="noreferrer"
                    alt="contractor website link">
                    {activeFeature.properties.CONTRACTOR1_NAME}
                  </a>
                ) : (
                  <p className="without-link">
                    {activeFeature.properties.CONTRACTOR1_NAME}
                  </p>
                )}
              </div>
              {activeFeature.properties.CONTRACTOR1_DESCRIPTION && (
                <p className="contractor-description">
                  {activeFeature.properties.CONTRACTOR1_DESCRIPTION}
                </p>
              )}
              <div className="contractor-phone">
                <FontAwesomeIcon icon={faPhone} />
                <a
                  className="tel-number bold"
                  href={'tel:' + activeFeature.properties.CONTRACTOR1_CONTACT}>
                  {activeFeature.properties.CONTRACTOR1_CONTACT}
                </a>
              </div>
            </div>
          )}

          { (activeFeature.properties.CONTRACTOR2_CONTACT && activeFeature.properties.CONTRACTOR2_CONTACT != activeFeature.properties.CONTRACTOR1_CONTACT) && (
            <div>
              <div className="contractor-name">
                {activeFeature.properties.CONTRACTOR2_WEBSITE ? (
                  <a
                    href={activeFeature.properties.CONTRACTOR2_WEBSITE}
                    className="website-link"
                    rel="noreferrer"
                    alt="contractor website link">
                    {activeFeature.properties.CONTRACTOR2_NAME}
                  </a>
                ) : (
                  <p className="without-link">
                    {activeFeature.properties.CONTRACTOR2_NAME}
                  </p>
                )}
              </div>
              {activeFeature.properties.CONTRACTOR2_DESCRIPTION && (
                <p className="contractor-description">
                  {activeFeature.properties.CONTRACTOR2_DESCRIPTION}
                </p>
              )}
              <div className="contractor-phone">
                <FontAwesomeIcon icon={faPhone} />
                <a
                  className="tel-number bold"
                  href={'tel:' + activeFeature.properties.CONTRACTOR2_CONTACT}>
                  {activeFeature.properties.CONTRACTOR2_CONTACT}
                </a>
              </div>
            </div>
          )}

          <p>Thank you for bringing this issue to our attention.</p>
        </div>
      </div>
    );
  };

  /* Constants for conditional rendering */
  const openPanel = !!activeFeature;

  return (
    <div className={'report-map-container' + (expanded ? ' expanded' : '')}>
      <div
        ref={panel}
        className={`side-panel ${openPanel ? 'open' : ''}`}
        onClick={() => maximizePanel(panel)}
        onTouchMove={() => maximizePanel(panel)}
        onKeyDown={keyEvent => {
          if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
            maximizePanel(panel);
          }
        }}>
        <button
          className="close-panel"
          aria-label={`${openPanel ? 'close side panel' : ''}`}
          aria-hidden={`${openPanel ? false : true}`}
          tabIndex={`${openPanel ? 0 : -1}`}
          onClick={() => setActiveFeature(false)}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="panel-content">{openPanel && renderPanel()}</div>
      </div>

      <div id="report-map" className="report-map">
        {touchDevice && (
          <Button
            className={
              'map-btn expand ' + (expanded ? ' expanded' : 'minimized')
            }
            variant="primary"
            onClick={() => {
              expanded ? setExpanded(false) : setExpanded(true);
            }}
            aria-label="my location">
            <FontAwesomeIcon
              icon={expanded ? faMinimize : faUpRightAndDownLeftFromCenter}
            />
            {expanded ? 'Minimize' : 'Expand'}
          </Button>
        )}

        <Button
          className="map-btn my-location"
          variant="primary"
          onClick={() => toggleMyLocation(mapRef, mapView)}
          aria-label="my location">
          <FontAwesomeIcon icon={faLocationCrosshairs} />
          My location
        </Button>

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
    </div>
  );
}
