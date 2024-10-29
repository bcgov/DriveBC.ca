// React
import React, { useEffect, useRef, useState, useCallback } from 'react';

// Redux
import { memoize } from 'proxy-memoize';
import { useSelector, useDispatch } from 'react-redux';

// Navigation
import { useSearchParams } from 'react-router-dom';

// Components and functions
import { NetworkError, ServerError } from '../data/helper';
import * as dataLoaders from './dataLoaders'
import * as slices from '../../slices';

import DriveBCMap from './Map';

export default function MapWrapper(props) {
  /* Setup */

  // Navigation
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux
  const dispatch = useDispatch();
  const {
    feeds: {
      cameras: { list: cameras, filteredList: filteredCameras, filterPoints: camFilterPoints },
      events: { list: events, filteredList: filteredEvents, filterPoints: eventFilterPoints },
      ferries: { list: ferries, filteredList: filteredFerries, filterPoints: ferryFilterPoints },
      weather: { list: currentWeather, filteredList: filteredCurrentWeathers, filterPoints: currentWeatherFilterPoints },
      regional: { list: regionalWeather, filteredList: filteredRegionalWeathers, filterPoints: regionalWeatherFilterPoints },
      hef: { list: hef, filteredList: filteredHef, filterPoints: hefFilterPoints },
      restStops: { list: restStops, filteredList: filteredRestStops, filterPoints: restStopFilterPoints },
    },
    advisories: { list: advisories, filteredList: filteredAdvisories, filterPoints: advisoryFilterPoints },
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

  // Refs
  const workerRef = useRef(null);

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  useEffect(() => {
    loadData();

    if (selectedRoute) {
      setSearchParams(new URLSearchParams({ type: 'route', searchTimestamp: selectedRoute.searchTimestamp }));
    }
  }, [selectedRoute]);

  useEffect(() => {
    // Cleanup function to terminate the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Function to load all data
  const loadData = () => {
    // Create a new worker if it doesn't exist
    if (!workerRef.current) {
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

    const routeData = selectedRoute && selectedRoute.routeFound ? selectedRoute : null;

    dataLoaders.loadCameras(routeData, cameras, null, camFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadEvents(routeData, events, null, eventFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadFerries(routeData, ferries, null, ferryFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadCurrentWeather(routeData, null, filteredCurrentWeathers, currentWeatherFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadRegionalWeather(routeData, null, filteredRegionalWeathers, regionalWeatherFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadHef(routeData, hef, filteredHef, null, dispatch, displayError, workerRef.current);
    dataLoaders.loadRestStops(routeData, restStops, null, restStopFilterPoints, dispatch, displayError, workerRef.current);
    dataLoaders.loadAdvisories(routeData, advisories, null, advisoryFilterPoints, dispatch, displayError, workerRef.current);
  };

  return (
    <DriveBCMap
      mapProps={props}
      showNetworkError={showNetworkError}
      showServerError={showServerError} />
  );
}
