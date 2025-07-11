// React
import React, {useEffect, useRef, useState, useCallback, useContext} from 'react';

// Redux
import { memoize } from 'proxy-memoize';
import { useSelector, useDispatch } from 'react-redux';

// Internal imports
import { MapContext } from "../../App";
import { NetworkError, ServerError } from '../data/helper';
import * as dataLoaders from './dataLoaders'
import * as slices from '../../slices';
import DriveBCMap from './Map';
import PollingComponent from '../shared/PollingComponent';

export default function MapWrapper(props) {
  /* Setup */
  // Context
  const { mapContext } = useContext(MapContext);

  // Redux
  const dispatch = useDispatch();
  const {
    feeds: {
      cameras: { list: cameras },
      events: { list: events },
      ferries: { list: ferries },
      weather: { list: currentWeathers },
      regional: { list: regionalWeathers },
      hef: { list: hef },
      restStops: { list: restStops },
      borderCrossings: { list: borderCrossings },
      wildfires: { list: wildfires },
    },
    advisories: { list: advisories },
    routes: { selectedRoute },

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
      })),
    ),
  );

  // States
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);

  const hasVisibleEvents = () => {
    return mapContext.visible_layers.closures || mapContext.visible_layers.majorEvents ||
      mapContext.visible_layers.minorEvents || mapContext.visible_layers.roadConditions ||
      mapContext.visible_layers.futureEvents || mapContext.visible_layers.chainUps;
  }

  const getInitialLoadingLayers = () => {
    return {
      cameras: mapContext.visible_layers.highwayCams,
      events: hasVisibleEvents(),
      ferries: mapContext.visible_layers.inlandFerries,
      weathers: mapContext.visible_layers.weather,
      restStops: mapContext.visible_layers.restStops,
      wildfires: mapContext.visible_layers.wildfires
    };
  };
  const [loadingLayers, setLoadingLayers] = useState(getInitialLoadingLayers());

  // Refs
  const workerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const trackedEventsRef = useRef({}); // Track event updates between refreshes
  const selectedRouteRef = useRef();
  const camerasRef = useRef(cameras);
  const eventsRef = useRef(events);
  const ferriesRef = useRef(ferries);
  const currentWeathersRef = useRef(currentWeathers);
  const regionalWeathersRef = useRef(regionalWeathers);
  const hefRef = useRef(hef);
  const restStopsRef = useRef(restStops);
  const borderCrossingsRef = useRef(borderCrossings);
  const advisoriesRef = useRef(advisories);
  const wildfiresRef = useRef(wildfires);

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  useEffect(() => {
    selectedRouteRef.current = selectedRoute;

    loadData();

    // Cleanup function to terminate the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [selectedRoute]);

  // Update references for polling calls in setInterval
  useEffect(() => {
    camerasRef.current = cameras;
  }, [cameras]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    ferriesRef.current = ferries;
  }, [ferries]);

  useEffect(() => {
    currentWeathersRef.current = currentWeathers;
  }, [currentWeathers]);

  useEffect(() => {
    regionalWeathersRef.current = regionalWeathers;
  }, [regionalWeathers]);

  useEffect(() => {
    hefRef.current = hef;
  }, [hef]);

  useEffect(() => {
    restStopsRef.current = restStops;
  }, [restStops]);

  useEffect(() => {
    borderCrossingsRef.current = borderCrossings;
  }, [borderCrossings]);

  useEffect(() => {
    advisoriesRef.current = advisories;
  }, [advisories]);

  useEffect(() => {
    wildfiresRef.current = wildfires;
  }, [wildfires]);

  const resetWorker = () => {
    // Terminate the current worker if it exists
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    workerRef.current = new Worker(new URL('./filterRouteWorker.js', import.meta.url));

    // Set up event listener for messages from the worker
    workerRef.current.onmessage = function (event) {
      const { data, filteredData, action } = event.data;

      dispatch(
        slices[action]({
          list: data,
          filteredList: filteredData,
          timeStamp: new Date().getTime()
        })
      );
    };
  }

  // Function to load all data
  const loadData = () => {
    resetWorker();

    const routeData = selectedRouteRef.current && selectedRouteRef.current.routeFound ? selectedRouteRef.current : null;

    // Toggleable map layers
    const reloadCameras = !camerasRef.current || (!isInitialLoad.current && mapContext.visible_layers.highwayCams);
    const reloadEvents = !eventsRef.current || (!isInitialLoad.current && hasVisibleEvents());
    const reloadFerries = !ferriesRef.current || (!isInitialLoad.current && mapContext.visible_layers.inlandFerries);
    const reloadHef = !hefRef.current || (!isInitialLoad.current && mapContext.visible_layers.weather);
    const reloadLocalWeathers = !currentWeathersRef.current || (!isInitialLoad.current && mapContext.visible_layers.weather);
    const reloadRegionalWeathers = !regionalWeathersRef.current || (!isInitialLoad.current && mapContext.visible_layers.weather);
    const reloadRestStops = !restStopsRef.current ||
      (!isInitialLoad.current && mapContext.visible_layers.restStops) ||
      (!isInitialLoad.current && mapContext.visible_layers.largeRestStops);
    const reloadWildfires = !wildfiresRef.current || (!isInitialLoad.current && mapContext.visible_layers.wildfires);

    // Non-toggleable map layers
    const reloadAdvisories = !advisoriesRef.current || !isInitialLoad.current;
    const reloadBorderCrossings = !borderCrossingsRef.current || !isInitialLoad.current;

    setLoadingLayers({
      cameras: reloadCameras,
      events: reloadEvents,
      ferries: reloadFerries,
      weathers: reloadLocalWeathers || reloadRegionalWeathers,
      restStops: reloadRestStops,
      wildfires: reloadWildfires
    });

    dataLoaders.loadCameras(routeData, reloadCameras ? null : camerasRef.current, dispatch, displayError, workerRef.current);
    dataLoaders.loadEvents(routeData, reloadEvents ? null : eventsRef.current, dispatch, displayError, workerRef.current, isInitialLoad.current, trackedEventsRef);
    dataLoaders.loadFerries(routeData, reloadFerries ? null : ferriesRef.current, dispatch, displayError, workerRef.current);
    dataLoaders.loadCurrentWeather(routeData, reloadLocalWeathers ? null : currentWeathersRef.current, dispatch, displayError, workerRef.current);
    dataLoaders.loadRegionalWeather(routeData, reloadRegionalWeathers ? null : regionalWeathersRef.current, dispatch, displayError, workerRef.current);
    dataLoaders.loadHef(routeData, reloadHef ? null : hefRef.current, dispatch, displayError, workerRef.current);
    dataLoaders.loadRestStops(routeData, reloadRestStops ? null : restStopsRef.current, dispatch, displayError, workerRef.current);
    dataLoaders.loadAdvisories(routeData, reloadAdvisories ? null : advisoriesRef.current, dispatch, displayError, workerRef.current);
    dataLoaders.loadBorderCrossings(routeData, reloadBorderCrossings ? null : borderCrossingsRef.current, dispatch, displayError, workerRef.current);
    dataLoaders.loadWildfires(routeData, reloadWildfires ? null : wildfiresRef.current, dispatch, displayError, workerRef.current);

    isInitialLoad.current = false;
  };

  return (
    <React.Fragment>
      <PollingComponent runnable={() => loadData()} interval={30000} />

      <DriveBCMap
        mapProps={props}
        showNetworkError={showNetworkError}
        showServerError={showServerError}
        trackedEventsRef={trackedEventsRef}
        loadingLayers={loadingLayers}
        setLoadingLayers={setLoadingLayers}
        getInitialLoadingLayers={getInitialLoadingLayers} />
    </React.Fragment>
  );
}
