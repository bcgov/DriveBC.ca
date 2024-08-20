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
import { memoize } from 'proxy-memoize';
import { useSelector, useDispatch } from 'react-redux';
import * as slices from '../../slices';

// External imports
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Spinner from 'react-bootstrap/Spinner';
import {
  faPlus,
  faMinus,
  faUpRightAndDownLeftFromCenter,
  faLocationCrosshairs,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from '@uidotdev/usehooks';

// Internal imports
import { addCameraGroups } from '../data/webcams.js';
import {
  blueLocationMarkup,
  fitMap,
  onMoveEnd,
  setLocationPin,
  setZoomPan,
  toggleMyLocation,
  zoomIn,
  zoomOut,
} from './helpers';
import { loadLayer, loadEventsLayers, enableReferencedLayer } from './layers';
import { MapContext } from '../../App.js';
import { maximizePanel, renderPanel, togglePanel } from './panels';
import { pointerMoveHandler, resetHoveredStates } from './handlers/hover';
import { pointerClickHandler, resetClickedStates } from './handlers/click';
import AdvisoriesWidget from '../advisories/AdvisoriesWidget';
import CurrentCameraIcon from '../cameras/CurrentCameraIcon';
import ExitSurvey from '../shared/ExitSurvey.js';
import Filters from '../shared/Filters.js';
import RouteSearch from '../routing/RouteSearch.js';
import NetworkErrorPopup from './errors/NetworkError';
import ServerErrorPopup from './errors/ServerError';
import overrides from '../map/overrides.js';

// Map & geospatial imports
import { applyStyle } from 'ol-mapbox-style';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { ScaleLine } from 'ol/control.js';

import Map from 'ol/Map';
import Geolocation from 'ol/Geolocation.js';
import MVT from 'ol/format/MVT.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View';

// Styling
import './Map.scss';

export default function DriveBCMap(props) {
  /* initialization */
  // Props
  const {
    mapProps: {referenceData, isCamDetail, mapViewRoute, loadCamDetails},
    showNetworkError, showServerError
  } = props;

  // Navigation
  const [searchParams, setSearchParams] = useSearchParams();

  let mousePointXClicked = undefined;

  // Context
  const { mapContext } = useContext(MapContext);

  // Enable referenced layer
  enableReferencedLayer(referenceData, mapContext);

  // Redux
  const dispatch = useDispatch();
  const {
    feeds: {
      cameras: { filteredList: filteredCameras },
      events: { filteredList: filteredEvents },
      ferries: { filteredList: filteredFerries },
      weather: { filteredList: filteredCurrentWeathers },
      regional: { filteredList: filteredRegionalWeathers },
      restStops: { filteredList: filteredRestStops },
    },
    advisories: { list: advisories },
    routes: { searchLocationFrom, searchLocationTo, selectedRoute },
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
          restStops: state.feeds.restStops,
        },
        advisories: state.cms.advisories,
        routes: state.routes,
        map: state.map
      })),
    ),
  );

  // Refs
  const mapLayers = useRef({});
  const geolocation = useRef();
  const hoveredFeature = useRef();
  const isInitialMountLocation = useRef();
  const searchParamInitialized = useRef();
  const locationPinRef = useRef();
  const mapElement = useRef();
  const mapRef = useRef();
  const mapView = useRef();
  const panel = useRef();
  const myLocationRef = useRef();
  const locationSet = useRef();
  const routingContainerRef = useRef();

  // States
  const [myLocationLoading, setMyLocationLoading] = useState(false);
  const [advisoriesInView, setAdvisoriesInView] = useState([]);
  const [referenceFeature, updateReferenceFeature] = useState();
  const [selectedFerries, setSelectedFerries] = useState();
  const [routeDistance, setRouteDistance] = useState();
  const [routeDistanceUnit, setRouteDistanceUnit] = useState();
  const [routeDetails, setRouteDetails] = useState({
    distance: null,
    distanceUnit: null,
    closures: null,
    majorEvents: null,
    minorEvents: null,
    roadConditions: null,
    advisories: null
  });
  const [loadingLayers, setLoadingLayers] = useState({
    cameras: mapContext.visible_layers.highwayCams,
    events: mapContext.visible_layers.closures || mapContext.visible_layers.majorEvents ||
      mapContext.visible_layers.minorEvents || mapContext.visible_layers.roadConditions ||
      mapContext.visible_layers.futureEvents,
    ferries: mapContext.visible_layers.inlandFerries,
    weathers: mapContext.visible_layers.weather,
    restStops: mapContext.visible_layers.restStops
  });

  // Workaround for OL handlers not being able to read states
  const [clickedFeature, setClickedFeature] = useState();
  const clickedFeatureRef = useRef();
  const updateClickedFeature = feature => {
    clickedFeatureRef.current = feature;
    setClickedFeature(feature);
    updatePosition(feature);
  };

  const updatePosition = (feature) => {
    // Do not process empty features and routes
    if (feature != null && feature.getProperties().type !== 'route') {
      let geometry = feature.getGeometry();

      if (geometry.getType() !== 'Point') { // feature is a line or polygon
        geometry = feature.getProperties().altFeature.getGeometry(); // use the point feature's geometry
      }

      if (mousePointXClicked < 390) {
        setZoomPan(mapView, mapView.current.getZoom(), geometry.flatCoordinates);
      }
    }
  };

  const loadMyLocation = () => {
    if(!locationSet.current){
    setMyLocationLoading(true)
    }
  }

  useEffect(()=>{
    if(myLocationLoading){
      toggleMyLocation(mapRef, mapView, setMyLocationLoading);
      locationSet.current = true;
    }
  },[myLocationLoading])
  /* useEffect hooks */
  /* initialization for OpenLayers map */
  useEffect(() => {
    if (mapRef.current) return; // stops map from initializing more than once

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
    const extent = [-155.230138, 36.180153, -102.977437, 66.591323];
    const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

    mapView.current = new View({
      projection: 'EPSG:3857',
      constrainResolution: true,
      center: fromLonLat(pan),
      zoom: isCamDetail || referenceData ? 5 : zoom,
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
        window.glStyle = glStyle;
        // DBC22-2153
        glStyle.metadata['ol:webfonts'] = '/fonts/{font-family}/{fontweight}{-fontstyle}.css';

        // Overrides
        for (const layer of glStyle.layers) {
          overrides.merge(layer, overrides[layer.id] || {});
        }

        applyStyle(vectorLayer, glStyle, 'esri');
      });
    });

    // create map
    mapRef.current = new Map({
      target: mapElement.current,
      layers: [vectorLayer],
      view: mapView.current,
      moveTolerance: 7,
      controls: [new ScaleLine({ units: 'metric' })],
    });
    window.mapRef = mapRef;

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
        mapView, isCamDetail, loadCamDetails
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
    }
  }, [searchLocationFrom]);

  /* Triggering handlers based on navigation data */
  useEffect(() => {
    if (referenceFeature) {
      // Do not trigger, routes will be handled by fitmap
      if (referenceFeature.get('type') !== 'route') {
        setZoomPan(mapView, 9, referenceFeature.getGeometry().flatCoordinates);
      }

      pointerClickHandler(
        [referenceFeature], clickedFeatureRef, updateClickedFeature,
        mapView, isCamDetail, loadCamDetails
      );
    }
  }, [referenceFeature]);

  /* Loading map layers */
  // Route layer
  useEffect(() => {
    // Remove layer if no route found
    const dl = selectedRoute && selectedRoute.routeFound ? selectedRoute : null;

    loadLayer(
      mapLayers, mapRef, mapContext,
      'routeLayer', dl, 3, null, updateReferenceFeature
    );

    if (selectedRoute && selectedRoute.routeFound) {
      // Fit map to route if route found and not saved/unsaved
      if (!selectedRoute.id || searchParams.get('type') == 'route') {
        fitMap(selectedRoute.route, mapView);
      }

      // Add route data to routeDetails
      setRouteDistance(selectedRoute.distance);
      setRouteDistanceUnit(selectedRoute.distanceUnit);

    } else {
      resetClickedStates(null, clickedFeatureRef, updateClickedFeature);
    }

  }, [selectedRoute]);

  // Cameras layer
  useEffect(() => {
    // Do nothing if list empty
    if (filteredCameras) {
      // Deep clone and add group reference to each cam
      const clonedCameras = JSON.parse(JSON.stringify(filteredCameras));
      const finalCameras = addCameraGroups(clonedCameras);

      loadLayer(
        mapLayers, mapRef, mapContext,
        'highwayCams', finalCameras, 63,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredCameras]);

  // Events layer
  useEffect(() => {
    loadEventsLayers(filteredEvents, mapContext, mapLayers, mapRef, referenceData, updateReferenceFeature, setLoadingLayers);

    // Count filtered events to store in routeDetails
    if (filteredEvents) {
      const eventCounts = {
        closures: 0,
        majorEvents: 0,
        minorEvents: 0,
        roadConditions: 0
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
    if (!isCamDetail) {
      loadLayer(
        mapLayers, mapRef, mapContext,
        'inlandFerries', filteredFerries, 66,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
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
        'weather', filteredCurrentWeathers, 68,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredCurrentWeathers]);

  // Regional weathers layer
  useEffect(() => {
    if (!isCamDetail) {
      loadLayer(
        mapLayers, mapRef, mapContext,
        'regional', filteredRegionalWeathers, 69,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredRegionalWeathers]);

  // Rest stops layer
  useEffect(() => {
    if (!isCamDetail) {
      loadLayer(
        mapLayers, mapRef, mapContext,
        'restStops', filteredRestStops, 60,
        referenceData, updateReferenceFeature, setLoadingLayers
      );

      loadLayer(
        mapLayers, mapRef, mapContext,
        'largeRestStops', filteredRestStops, 60,
        referenceData, updateReferenceFeature, setLoadingLayers
      );
    }
  }, [filteredRestStops]);

  // Advisories layer
  useEffect(() => {
    loadLayer(
      mapLayers, mapRef, mapContext,
      'advisoriesLayer', advisories, 5
    );

    if (advisories) {
      if (mapRef.current) {
        // First filter
        onMoveEnd(mapRef.current, advisories, setAdvisoriesInView);

        // Set handler for filtering on map move
        mapRef.current.on('moveend', (e) => onMoveEnd(e.map, advisories, setAdvisoriesInView));
      }
    }
  }, [advisories]);

  /* Constants for conditional rendering */
  // Disable cam panel in details page
  const disablePanel = isCamDetail && clickedFeature && clickedFeature.get('type') === 'camera';
  const openPanel = !!clickedFeature && !disablePanel;
  const smallScreen = useMediaQuery('only screen and (max-width: 767px)');

  // Reset search params when panel is closed
  useEffect(() => {
    if (searchParamInitialized.current) {
      if (!openPanel) {
        setSearchParams(new URLSearchParams({}));
      }

    } else {
      searchParamInitialized.current = true;
    }
  }, [openPanel]);

  /* Rendering */
  return (
    <div className={`map-container ${isCamDetail ? 'preview' : ''}`}>
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
        <button
          className="close-panel"
          aria-label={`${openPanel ? 'close side panel' : ''}`}
          aria-hidden={`${openPanel ? false : true}`}
          tabIndex={`${openPanel ? 0 : -1}`}
          onClick={() => {
            togglePanel(panel, resetClickedStates, clickedFeatureRef, updateClickedFeature, [
              myLocationRef, routingContainerRef
            ]);
          }}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="panel-content">
          {openPanel && (
            (selectedRoute && selectedRoute.routeFound) && renderPanel(clickedFeature, null, {...routeDetails, ferries: selectedFerries, distance: routeDistance, distanceUnit: routeDistanceUnit})
          )}

          {openPanel && (
            (!selectedRoute || !selectedRoute.routeFound) && renderPanel((clickedFeature && !clickedFeature.get)
            ? advisoriesInView
            : clickedFeature , isCamDetail )
          )}
        </div>
      </div>

      <div ref={mapElement} className="map">
        {!isCamDetail && (
          <div className={`map-left-container ${(showServerError || showNetworkError) ? 'error-showing' : ''} ${openPanel && 'margin-pushed'}`}>
            {smallScreen && (
              <ExitSurvey mobile={true} />
            )}
            <RouteSearch ref={routingContainerRef} routeEdit={true} />
            <AdvisoriesWidget advisories={advisoriesInView} updateClickedFeature={updateClickedFeature} open={openPanel} clickedFeature={clickedFeature} clickedFeatureRef={clickedFeatureRef} onMap={true} />
          </div>
        )}

        {(!isCamDetail && smallScreen) && (
          <React.Fragment>
            <Button
              ref={myLocationRef}
              className="map-btn my-location"
              variant="primary"
              onClick={() => loadMyLocation(mapRef, mapView)}
              aria-label="my location">
              <FontAwesomeIcon icon={faLocationCrosshairs} />
              My location
            </Button>

            <Filters
              mapLayers={mapLayers}
              disableFeatures={isCamDetail}
              enableRoadConditions={true}
              isCamDetail={isCamDetail}
              referenceData={referenceData}
              loadingLayers={loadingLayers} />
          </React.Fragment>
        )}

        {(!isCamDetail && !smallScreen) && (
          <React.Fragment>
            <Filters
              mapLayers={mapLayers}
              disableFeatures={isCamDetail}
              enableRoadConditions={true}
              isCamDetail={isCamDetail}
              referenceData={referenceData}
              loadingLayers={loadingLayers} />

            <Button
              ref={myLocationRef}
              className={`map-btn my-location ${openPanel && 'margin-pushed'}`}
              variant="primary"
              onClick={() => loadMyLocation(mapRef, mapView)}
              aria-label="my location">
                {(!myLocationLoading) ? <Spinner animation="border" role="status" /> : <FontAwesomeIcon icon={faLocationCrosshairs} />}
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

      {isCamDetail && (
        <Button
          className="map-btn cam-location"
          variant="primary"
          onClick={() => {
            if (referenceData) {
              setZoomPan(mapView, 12, fromLonLat(referenceData.location.coordinates));
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
          textOverride={'Layer filters'}
          isCamDetail={isCamDetail}
          referenceData={referenceData} />
      )}

      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup />
      }
    </div>
  );
}
