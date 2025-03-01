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
      cameras: { list: cameras, filterPoints: camFilterPoints },
      events: { list: events, filterPoints: eventFilterPoints },
      ferries: { list: ferries, filterPoints: ferryFilterPoints },
      weather: { list: currentWeathers, filterPoints: currentWeatherFilterPoints },
      regional: { list: regionalWeathers, filterPoints: regionalWeatherFilterPoints },
      hef: { list: hef, filteredList: filteredHef },
      restStops: { list: restStops, filterPoints: restStopFilterPoints },
    },
    advisories: { list: advisories, filterPoints: advisoryFilterPoints },
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
          filterPoints: route ? route.points : null,
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
      cameras: true,
      events: true,
      ferries: true,
      weathers: true,
      restStops: true
    });

    dataLoaders.loadCameras(routeData, cameras, null, camFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadEvents(routeData, events, null, eventFilterPoints, dispatch, displayError, workerRef.current, isInitialLoad.current, trackedEventsRef);
    dataLoaders.loadFerries(routeData, ferries, null, ferryFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadCurrentWeather(routeData, currentWeathers, null, currentWeatherFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadRegionalWeather(routeData, regionalWeathers, null, regionalWeatherFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadHef(routeData, hef, filteredHef, null, dispatch, displayError, workerRef.current);
    dataLoaders.loadRestStops(routeData, restStops, null, restStopFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadAdvisories(routeData, advisories, null, advisoryFilterPoints, dispatch, displayError, workerRef.current);

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
