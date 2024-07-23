// React
import React, { useEffect, useState, useCallback } from 'react';

// Redux
import { memoize } from 'proxy-memoize';
import { useSelector, useDispatch } from 'react-redux';

// Components and functions
import { NetworkError, ServerError } from '../data/helper';
import * as dataLoaders from './dataLoaders'
import DriveBCMap from './Map';

export default function MapWrapper(props) {
  // Redux
  const dispatch = useDispatch();
  const {
    feeds: {
      cameras: { list: cameras, filteredList: filteredCameras, filterPoints: camFilterPoints },
      events: { list: events, filteredList: filteredEvents, filterPoints: eventFilterPoints },
      ferries: { list: ferries, filteredList: filteredFerries, filterPoints: ferryFilterPoints },
      weather: { list: currentWeather, filteredList: filteredCurrentWeathers, filterPoints: currentWeatherFilterPoints },
      regional: { list: regionalWeather, filteredList: filteredRegionalWeathers, filterPoints: regionalWeatherFilterPoints },
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
  }, [selectedRoute]);

  // Function to load all data
  const loadData = () => {
    if (selectedRoute && selectedRoute.routeFound) {
      // Clear and update data
      dataLoaders.loadCameras(selectedRoute, cameras, filteredCameras, camFilterPoints, dispatch, displayError);
      dataLoaders.loadEvents(selectedRoute, events, filteredEvents, eventFilterPoints, dispatch, displayError);
      dataLoaders.loadFerries(selectedRoute, ferries, filteredFerries, ferryFilterPoints, dispatch, displayError);
      dataLoaders.loadCurrentWeather(selectedRoute, currentWeather, filteredCurrentWeathers, currentWeatherFilterPoints, dispatch, displayError);
      dataLoaders.loadRegionalWeather(selectedRoute, regionalWeather, filteredRegionalWeathers, regionalWeatherFilterPoints, dispatch, displayError);
      dataLoaders.loadRestStops(selectedRoute, restStops, filteredRestStops, restStopFilterPoints, dispatch, displayError);
      dataLoaders.loadAdvisories(selectedRoute, advisories, filteredAdvisories, advisoryFilterPoints, dispatch, displayError);

    } else {
      // Clear and update data
      dataLoaders.loadCameras(null, cameras, filteredCameras, camFilterPoints, dispatch, displayError);
      dataLoaders.loadEvents(null, events, filteredEvents, eventFilterPoints, dispatch, displayError);
      dataLoaders.loadFerries(null, ferries, filteredFerries, ferryFilterPoints, dispatch, displayError);
      dataLoaders.loadCurrentWeather(null, currentWeather, filteredCurrentWeathers, currentWeatherFilterPoints, dispatch, displayError);
      dataLoaders.loadRegionalWeather(null, regionalWeather, filteredRegionalWeathers, regionalWeatherFilterPoints, dispatch, displayError);
      dataLoaders.loadRestStops(null, restStops, filteredRestStops, restStopFilterPoints, dispatch, displayError);
      dataLoaders.loadAdvisories(advisories, dispatch, displayError);
    }
  };

  return (
    <DriveBCMap
      mapProps={props}
      showNetworkError={showNetworkError}
      showServerError={showServerError} />
  );
}
