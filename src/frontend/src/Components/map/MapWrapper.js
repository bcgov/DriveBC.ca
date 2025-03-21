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

  const getInitialLoadingLayers = () => {
    return {
      cameras: mapContext.visible_layers.highwayCams,
      events: mapContext.visible_layers.closures || mapContext.visible_layers.majorEvents ||
        mapContext.visible_layers.minorEvents || mapContext.visible_layers.roadConditions ||
        mapContext.visible_layers.futureEvents || mapContext.visible_layers.chainUps,
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

  const resetWorker = () => {
    // Terminate the current worker if it exists
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    workerRef.current = new Worker(new URL('./filterRouteWorker.js', import.meta.url));

    // Set up event listener for messages from the worker
    workerRef.current.onmessage = function (event) {
      const { data, filteredData, route, action } = event.data;

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

    setLoadingLayers({
      cameras: !cameras || !isInitialLoad.current,
      events: !events || !isInitialLoad.current,
      ferries: !ferries || !isInitialLoad.current,
      weathers: !currentWeathers || !regionalWeathers || !isInitialLoad.current,
      restStops: !restStops || !isInitialLoad.current
    });

    if (!cameras || !isInitialLoad.current) dataLoaders.loadCameras(routeData, cameras, dispatch, displayError, workerRef.current);
    if (!events || !isInitialLoad.current) dataLoaders.loadEvents(routeData, events, dispatch, displayError, workerRef.current, isInitialLoad.current, trackedEventsRef);
    if (!ferries || !isInitialLoad.current) dataLoaders.loadFerries(routeData, ferries, dispatch, displayError, workerRef.current);
    if (!currentWeathers || !isInitialLoad.current) dataLoaders.loadCurrentWeather(routeData, currentWeathers, dispatch, displayError, workerRef.current);
    if (!regionalWeathers || !isInitialLoad.current) dataLoaders.loadRegionalWeather(routeData, regionalWeathers, dispatch, displayError, workerRef.current);
    if (!hef || !isInitialLoad.current) dataLoaders.loadHef(routeData, hef, dispatch, displayError, workerRef.current);
    if (!restStops || !isInitialLoad.current) dataLoaders.loadRestStops(routeData, restStops, dispatch, displayError, workerRef.current);
    if (!advisories || !isInitialLoad.current) dataLoaders.loadAdvisories(routeData, advisories, dispatch, displayError, workerRef.current);
    if (!borderCrossings || !isInitialLoad.current) dataLoaders.loadBorderCrossings(routeData, borderCrossings, dispatch, displayError, workerRef.current);

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
