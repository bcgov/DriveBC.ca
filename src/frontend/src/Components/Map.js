// React
import React, { useContext, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server';

// Third party packages
import { useMediaQuery } from '@uidotdev/usehooks';
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

// react-bootstrap-typeahead
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';

// Components and functions
import { getEvents } from './data/events.js';
import { getLocations } from './data/locations.js';
import { getWebcams } from './data/webcams.js';
import Layers from './Layers.js';
import FriendlyTime from './FriendlyTime';
import EventTypeIcon from './EventTypeIcon';
import CurrentCameraIcon from './CurrentCameraIcon';

// OpenLayers
import { applyStyle } from 'ol-mapbox-style';
import { Circle } from 'ol/geom.js';
import { fromLonLat } from 'ol/proj';
import { Image as ImageLayer } from 'ol/layer.js';
import { MapContext } from '../App.js';
import { Point, LineString } from 'ol/geom';
import { ScaleLine } from 'ol/control.js';
import { Style } from 'ol/style.js';
import * as ol from 'ol';
import Cluster from 'ol/source/Cluster.js';
import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import ImageWMS from 'ol/source/ImageWMS.js';
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
import { eventStyles, cameraStyles } from './data/eventStyleDefinitions.js';
import './Map.scss';

export default function MapWrapper({
  camera,
  isPreview,
  cameraHandler,
  mapViewRoute,
}) {
  const { mapContext, setMapContext } = useContext(MapContext);
  const mapElement = useRef();
  const mapRef = useRef();
  const popup = useRef();
  const layers = useRef({});
  const clickedWebcam = useRef(null);
  const mapView = useRef();
  const lng = -120.7862;
  const lat = 50.113;
  const [layersOpen, setLayersOpen] = useState(false);
  const container = useRef();
  const content = useRef();
  const [iconClicked, setIconClicked] = useState(false);
  const geolocation = useRef(null);
  const largeScreen = useMediaQuery('only screen and (min-width : 768px)');
  const navigate = useNavigate();
  const hoveredCamera = useRef();
  const hoveredEvent = useRef();
  const clickedCamera = useRef();
  const clickedEvent = useRef();

  // Typeahead states
  const [isSearching, setSearching] = useState(false);
  const [options, setLocationOptions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  function centerMyLocation(coordinates) {
    if (mapRef.current) {
      mapView.current.animate({
        center: fromLonLat(coordinates),
      });
    }
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
      highwayLayer: new ImageLayer({
        classname: 'highway',
        type: 'overlay',
        visible: mapContext.visible_layers.highwayLayer,
        source: new ImageWMS({
          url: `${process.env.REACT_APP_HIGHWAY_LAYER}`,
          serverType: 'geoserver',
          params: {
            LAYERS: 'hwy:DSA_CONTRACT_AREA',
          },
          transition: 0,
        }),
      }),

      open511Layer: new ImageLayer({
        className: 'open511',
        type: 'overlay',
        visible: mapContext.visible_layers.open511Layer,
        source: new ImageWMS({
          url: `${process.env.REACT_APP_OPEN511_LAYER}`,
          params: {
            LAYERS: 'op5:OP5_EVENT511_ACTIVE_V',
          },
          serverType: 'geoserver',
          transition: 0,
        }),
      }),

      tid: Date.now(),
    };

    mapView.current = new View({
      projection: 'EPSG:3857',
      constrainResolution: true,
      center: camera ? handleCenter() : fromLonLat([lng, lat]),
      zoom: 10,
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
            layers.current['highwayLayer'],
            layers.current['open511Layer'],
          ]
        : [
            vectorLayer,
            layers.current['highwayLayer'],
            layers.current['open511Layer'],
          ],
      overlays: [popup.current],
      view: mapView.current,
      controls: [new ScaleLine({ units: 'metric' })],
    });

    geolocation.current = new Geolocation({
      projection: mapView.current.getProjection(),
    });

    mapRef.current.once('loadend', () => {
      loadWebcams();
      loadEvents();
    });

    mapRef.current.on('click', e => {
      setIconClicked(false);
      const coordinate = e.coordinate;
      // check if it was a webcam icon that was clicked
      layers.current['webcamsLayer']
        .getFeatures(e.pixel)
        .then(clickedFeatures => {
          if (clickedFeatures[0]) {
            const featureDetails =
              clickedFeatures[0].values_.features[0].values_;
            if (isPreview) {
              // Only switch context on clicking cameras within circle
              if (
                circle &&
                circle.intersectsCoordinate(
                  fromLonLat(featureDetails.location.coordinates),
                )
              ) {
                mapView.current.animate({
                  center: fromLonLat(featureDetails.location.coordinates),
                });

                cameraHandler(featureDetails);
              }
            } else {
              setIconClicked(true);
              // reset previous clicked feature
              if (clickedCamera.current) {
                clickedCamera.current.setStyle(cameraStyles['static']);
              } else if (clickedEvent.current) {
                clickedEvent.current.setStyle(
                  getEventIcon(clickedEvent.current, 'static'),
                );
                setRelatedGeometry(clickedEvent.current, 'static');
                clickedEvent.current = null;
              }
              // set new clicked camera feature
              clickedCamera.current = clickedFeatures[0];
              clickedCamera.current.setStyle(cameraStyles['active']);
              clickedCamera.current.setProperties({ clicked: true }, true);

              content.current.innerHTML =
                `<div class="popup popup--camera">
              <div class="popup__title">
                <p class="bold name">${featureDetails.name}
                <p class="bold orientation">${featureDetails.orientation}</p>
              </div>
              <div class="popup__description">
                <p>${featureDetails.caption}</p>
                <div class="camera-image">
                  <img src="${featureDetails.links.imageSource}" width='300'>
                  <div class="timestamp">
                    <p class="driveBC">Drive<span>BC</span></p>
                    <p>` +
                ReactDOMServer.renderToString(
                  <FriendlyTime date={featureDetails.last_update_modified} />,
                ) +
                `</p>
                  </div>
                </div>
              </div>
            </div>`;
              popup.current.setPosition(coordinate);
              clickedWebcam.current = featureDetails;
            }
          }
        });

      // if it wasn't a webcam icon, check if it was an event
      layers.current['eventsLayer']
        .getFeatures(e.pixel)
        .then(clickedFeatures => {
          setIconClicked(true);
          if (clickedFeatures[0]) {
            const feature = clickedFeatures[0];
            const severity = feature.get('severity').toLowerCase();
            const eventType = feature.get('event_type').toLowerCase();

            // reset previous clicked feature
            if (clickedCamera.current) {
              clickedCamera.current.setStyle(cameraStyles['static']);
              clickedCamera.current = null;
            } else if (clickedEvent.current) {
              clickedEvent.current.setStyle(
                getEventIcon(clickedEvent.current, 'static'),
              );
              setRelatedGeometry(clickedEvent.current, 'static');
            }

            // set new clicked event feature
            clickedEvent.current = clickedFeatures[0];
            clickedEvent.current.setStyle(
              getEventIcon(clickedEvent.current, 'active'),
            );
            setRelatedGeometry(clickedEvent.current, 'active');

            clickedEvent.current.setProperties({ clicked: true }, true);

            content.current.innerHTML =
              `<div class="popup popup--delay ${severity}">
              <div class="popup__title">
                <p class="bold name">${feature.get('route_display')}</p>
                <p class="bold orientation">${feature.get('direction')}</p>
              </div>
              <div class="popup__description">
                <div class="delay-type">
                  <div class="bold delay-severity"><div class="delay-icon">` +
              ReactDOMServer.renderToString(
                <EventTypeIcon eventType={eventType} />,
              ) +
              `</div><p class="bold">${severity} delays</p></div>
                  <p class="bold friendly-time--mobile">` +
              ReactDOMServer.renderToString(
                <FriendlyTime date={feature.get('last_updated')} />,
              ) +
              `</p>
                </div>
                <div class="delay-details">
                  <p class="bold friendly-time-desktop">` +
              ReactDOMServer.renderToString(
                <FriendlyTime date={feature.get('last_updated')} />,
              ) +
              `</p>
                  <p>${feature.get('description')}</p>
                </div>
              </div>
            </div>`;

            popup.current.setPosition(coordinate);
          }
        });

      // if neither, hide any existing popup
      if (iconClicked === false) {
        popup.current.setPosition(undefined);
        clickedWebcam.current = null;

        // reset previous clicked feature
        if (clickedCamera.current) {
          clickedCamera.current.setStyle(cameraStyles['static']);
        } else if (clickedEvent.current) {
          clickedEvent.current.setStyle(
            getEventIcon(clickedEvent.current, 'static'),
          );
          setRelatedGeometry(clickedEvent.current, 'static');
        }

        clickedCamera.current = null;
        clickedEvent.current = null;
      }
    });

    mapRef.current.on('pointermove', e => {
      if (layers.current && 'webcamsLayer' in layers.current) {
        // check if it was a camera icon that was hovered on
        layers.current['webcamsLayer']
          .getFeatures(e.pixel)
          .then(hoveredFeatures => {
            if (hoveredFeatures[0]) {
              hoveredCamera.current = hoveredFeatures[0];
              if (!hoveredCamera.current.getProperties().clicked) {
                hoveredCamera.current.setStyle(cameraStyles['hover']);
              }
            } else if (hoveredCamera.current) {
              if (!hoveredCamera.current.getProperties().clicked) {
                hoveredCamera.current.setStyle(cameraStyles['static']);
              }

              hoveredCamera.current = null;
            }
          });
      }

      if (layers.current && 'eventsLayer' in layers.current) {
        // if it wasn't a camera icon, check if it was an event
        layers.current['eventsLayer']
          .getFeatures(e.pixel)
          .then(hoveredFeatures => {
            if (hoveredFeatures[0]) {
              hoveredEvent.current = hoveredFeatures[0];
              if (!hoveredEvent.current.getProperties().clicked) {
                hoveredEvent.current.setStyle(
                  getEventIcon(hoveredEvent.current, 'hover'),
                );
                setRelatedGeometry(hoveredEvent.current, 'hover');
              }
            } else if (hoveredEvent.current) {
              if (!hoveredEvent.current.getProperties().clicked) {
                hoveredEvent.current.setStyle(
                  getEventIcon(hoveredEvent.current, 'static'),
                );
                setRelatedGeometry(hoveredEvent.current, 'static');
              }
              hoveredEvent.current = null;
            }
          });
      }
    });
  }, []);

  useEffect(() => {
    console.log(selectedLocation);
  }, [selectedLocation]);

  async function loadWebcams() {
    const webcamResults = await getWebcams();

    layers.current['webcamsLayer'] = new VectorLayer({
      classname: 'webcams',
      visible: mapContext.visible_layers.webcamsLayer,
      source: new Cluster({
        distance: 35,
        source: new VectorSource({
          format: new GeoJSON(),
          loader: function (extent, resolution, projection) {
            const vectorSource = this;
            vectorSource.clear();

            if (webcamResults) {
              webcamResults.forEach(cameraData => {
                // Build a new OpenLayers feature
                const olGeometry = new Point(cameraData.location.coordinates);
                const olFeature = new ol.Feature({ geometry: olGeometry });

                // Transfer properties
                olFeature.setProperties(cameraData);
                // Transform the projection
                const olFeatureForMap = transformFeature(
                  olFeature,
                  'EPSG:4326',
                  mapRef.current.getView().getProjection().getCode(),
                );

                vectorSource.addFeature(olFeatureForMap);
              });
            }
          },
        }),
      }),
      style: cameraStyles['static'],
    });

    mapRef.current.addLayer(layers.current['webcamsLayer']);
  }

  async function loadEvents() {
    const eventData = await getEvents();

    // Events iterator
    layers.current['eventsLayer'] = new VectorLayer({
      classname: 'events',
      visible: mapContext.visible_layers.eventsLayer,
      source: new VectorSource({
        format: new GeoJSON(),
        loader: function (extent, resolution, projection) {
          const vectorSource = this;
          vectorSource.clear();
          if (eventData) {
            eventData.forEach(record => {
              let olGeometry = null;
              let centroidFeatureForMap = null;
              switch (record.location.type) {
                case 'Point':
                  olGeometry = new Point(record.location.coordinates);
                  break;
                case 'LineString':
                  olGeometry = new LineString(record.location.coordinates);
                  break;
                default:
                  console.log(Error);
              }
              const olFeature = new ol.Feature({ geometry: olGeometry });

              // Transfer properties
              olFeature.setProperties(record);

              // Transform the projection
              const olFeatureForMap = transformFeature(
                olFeature,
                'EPSG:4326',
                mapRef.current.getView().getProjection().getCode(),
              );

              if (olFeature.getGeometry().getType() === 'LineString') {
                const centroidGeometry = new Point(
                  olFeature.getGeometry().getCoordinates()[
                    Math.floor(
                      olFeature.getGeometry().getCoordinates().length / 2,
                    )
                  ],
                );
                const centroidFeature = new ol.Feature({
                  geometry: centroidGeometry,
                });
                // Transfer properties
                centroidFeature.setProperties(record);
                // Transform the projection
                centroidFeatureForMap = transformFeature(
                  centroidFeature,
                  'EPSG:4326',
                  mapRef.current.getView().getProjection().getCode(),
                );
                centroidFeatureForMap.setId(olFeatureForMap.ol_uid);
                vectorSource.addFeature(centroidFeatureForMap);
                olFeatureForMap.setId(centroidFeatureForMap.ol_uid);
              }

              vectorSource.addFeature(olFeatureForMap);
            });
          }
        },
      }),
      style: function (feature, resolution) {
        return getEventIcon(feature, 'static');
      },
    });
    mapRef.current.addLayer(layers.current['eventsLayer']);
  }

  function loadLocationOptions(locationInput) {
    setSearching(true);
    getLocations(locationInput).then(locationsData => {
      setLocationOptions(
        locationsData.features.map(feature => {
          return {
            ...feature,
            label: feature.properties.fullAddress,
          };
        }),
      );
      setSearching(false);
    });
  }

  function webcamDetailRoute() {
    // setting geometry to null so that the object may be passed
    if (clickedWebcam.current) {
      clickedWebcam.current.geometry = null;
      navigate(`/cameras-page/${clickedWebcam.current.id}`);
    }
  }

  function closePopup(event) {
    event.stopPropagation();
    popup.current.setPosition(undefined);
    setIconClicked(false);
    // check for active camera icons
    if (clickedCamera.current) {
      clickedCamera.current.setStyle(cameraStyles['static']);
      clickedCamera.current.set('clicked', 'false');
      clickedCamera.current = null;
    }
    // check for active event icons
    if (clickedEvent.current) {
      clickedEvent.current.setStyle(
        getEventIcon(clickedEvent.current, 'static'),
      );
      setRelatedGeometry(clickedEvent.current, 'static');
      clickedEvent.current.set('clicked', 'false');
      clickedEvent.current = null;
    }
  }

  const setRelatedGeometry = (event, state) => {
    const relatedGeometryId = event.ol_uid;
      if (relatedGeometryId) {
        const relatedFeature = layers.current["eventsLayer"].getSource().getFeatureById(relatedGeometryId);
        relatedFeature.setStyle(getEventIcon(relatedFeature, state));
      }
  }

  const getEventIcon = (event, state) => {
    const severity = event.get('severity').toLowerCase();
    const type = event.get('event_type').toLowerCase();
    const geometry = event.getGeometry().getType();
    if (geometry === 'Point') {
      if (severity === 'major') {
        switch (type) {
          case 'incident':
            return eventStyles['major_incident'][state];
          case 'construction':
            return eventStyles['major_construction'][state];
          case 'special_event':
            return eventStyles['major_special_event'][state];
          case 'weather_condition':
            return eventStyles['major_weather_condition'][state];
          default:
            return eventStyles['major_incident'][state];
        }
      } else {
        switch (type) {
          case 'incident':
            return eventStyles['incident'][state];
          case 'construction':
            return eventStyles['construction'][state];
          case 'special_event':
            return eventStyles['special_event'][state];
          case 'weather_condition':
            return eventStyles['weather_condition'][state];
          default:
            return eventStyles['incident'][state];
        }
      }
    } else {
      return eventStyles['segments'][state];
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
          centerMyLocation([longitude, latitude]);
          addMyLocationPinPoint([longitude, latitude]);
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

  function transformFeature(feature, sourceCRS, targetCRS) {
    const clone = feature.clone();
    clone.getGeometry().transform(sourceCRS, targetCRS);
    return clone;
  }

  return (
    <div className="map-container">
      <div ref={mapElement} className="map" />
      <div id="popup" onClick={webcamDetailRoute} className="ol-popup">
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
          variant="outline-primary"
          onClick={mapViewRoute}>
          <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />
          Map View
        </Button>
      )}

      {isPreview && (
        <Button
          className="map-btn cam-location"
          variant="outline-primary"
          onClick={handleRecenter}>
          <CurrentCameraIcon />
          Camera location
        </Button>
      )}
      {!isPreview && (!iconClicked || largeScreen) && (
        <Button
          className="map-btn my-location"
          variant="outline-primary"
          onClick={toggleMyLocation}>
          <FontAwesomeIcon icon={faLocationCrosshairs} />
          My location
        </Button>
      )}

      <div className="zoom-btn">
        <Button className="zoom-in" variant="outline-primary" onClick={zoomIn}>
          <FontAwesomeIcon icon={faPlus} />
        </Button>
        <div className="zoom-divider" />
        <Button
          className="zoom-out"
          variant="outline-primary"
          onClick={zoomOut}>
          <FontAwesomeIcon icon={faMinus} />
        </Button>
      </div>

      {!isPreview && (
        <div>
          <div className="typeahead-container">
            <AsyncTypeahead
              filterBy={() => true}
              id="location-search-typeahead"
              isLoading={isSearching}
              labelKey="label"
              minLength={3}
              onChange={setSelectedLocation}
              onSearch={loadLocationOptions}
              options={options}
              placeholder="Search for a location..."
              renderMenuItemChildren={location => (
                <div>
                  <span>{location.properties.fullAddress}</span>
                </div>
              )}
            />
          </div>

          <Layers
            open={layersOpen}
            setLayersOpen={toggleLayers}
            toggleLayer={toggleLayer}
          />
        </div>
      )}
    </div>
  );
}
