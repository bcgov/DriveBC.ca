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
      restStops: mapContext.visible_layers.restStops
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
    const loadCameras = !camerasRef.current || (!isInitialLoad.current && mapContext.visible_layers.highwayCams);
    const loadEvents = !eventsRef.current || (!isInitialLoad.current && hasVisibleEvents());
    const loadFerries = !ferriesRef.current || (!isInitialLoad.current && mapContext.visible_layers.inlandFerries);
    const loadHef = !hefRef.current || (!isInitialLoad.current && mapContext.visible_layers.weather);
    const loadLocalWeathers = !currentWeathersRef.current || (!isInitialLoad.current && mapContext.visible_layers.weather);
    const loadRegionalWeathers = !regionalWeathersRef.current || (!isInitialLoad.current && mapContext.visible_layers.weather);
    const loadRestStops = !restStopsRef.current ||
      (!isInitialLoad.current && mapContext.visible_layers.restStops) ||
      (!isInitialLoad.current && mapContext.visible_layers.largeRestStops);

    // Non-toggleable map layers
    const loadAdvisories = !advisoriesRef.current || !isInitialLoad.current;
    const loadBorderCrossings = !borderCrossingsRef.current || !isInitialLoad.current;

    setLoadingLayers({
      cameras: loadCameras,
      events: loadEvents,
      ferries: loadFerries,
      weathers: loadLocalWeathers || loadRegionalWeathers,
      restStops: loadRestStops
    });

    if (loadCameras) dataLoaders.loadCameras(routeData, dispatch, displayError, workerRef.current);
    if (loadEvents) dataLoaders.loadEvents(routeData, dispatch, displayError, workerRef.current, isInitialLoad.current, trackedEventsRef);
    if (loadFerries) dataLoaders.loadFerries(routeData, dispatch, displayError, workerRef.current);
    if (loadLocalWeathers) dataLoaders.loadCurrentWeather(routeData, dispatch, displayError, workerRef.current);
    if (loadRegionalWeathers) dataLoaders.loadRegionalWeather(routeData, dispatch, displayError, workerRef.current);
    if (loadHef) dataLoaders.loadHef(routeData, dispatch, displayError, workerRef.current);
    if (loadRestStops) dataLoaders.loadRestStops(routeData, dispatch, displayError, workerRef.current);
    if (loadAdvisories) dataLoaders.loadAdvisories(routeData, dispatch, displayError, workerRef.current);
    if (loadBorderCrossings) dataLoaders.loadBorderCrossings(routeData, dispatch, displayError, workerRef.current);

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
