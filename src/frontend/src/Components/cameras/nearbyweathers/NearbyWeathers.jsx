// React
import React, { useCallback, useEffect, useState } from 'react';

// Redux
import { memoize } from "proxy-memoize";
import { useSelector } from "react-redux";

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSunCloud, faTemperatureHalf, faMountain } from '@fortawesome/pro-regular-svg-icons';
import Skeleton from "react-loading-skeleton";

// Internal imports
import NearbyRegionalWeather from "./NearbyRegionalWeather";
import NearbyLocalWeather from "./NearbyLocalWeather";
import NearbyHevWeather from "./NearbyHevWeather";

// Styling
import './NearbyWeathers.scss';

const WEATHER_TAB_ICONS = {
  Roadside: faTemperatureHalf,
  Regional: faSunCloud,
  'High elevation': faMountain,
};

// null = N/A or loaded-but-missing; undefined = feed not loaded yet
const resolveStation = (list, stationId) => {
  if (!stationId) {
    return null;
  }

  if (list == null) {
    return undefined;
  }

  return list.find(station => station.id === stationId) ?? null;
};

// Main component
export default function NearbyWeathers(props) {
  /* Setup */
  // Redux
  const {
    feeds: {
      weather: { list: currentWeatherList },
      regional: { list: regionalWeatherList },
      hef: { list: hefList },
    }
  } = useSelector(useCallback(memoize(state => ({
    feeds: {
      weather: state.feeds.weather,
      regional: state.feeds.regional,
      hef: state.feeds.hef,
    }
  }))));

  // Props
  const { camera } = props;

  const regionalWeather = resolveStation(regionalWeatherList, camera.regional_weather_station);
  const localWeather = resolveStation(currentWeatherList, camera.local_weather_station);
  const hef = resolveStation(hefList, camera.hev_station);

  const isLoading =
    regionalWeather === undefined ||
    localWeather === undefined ||
    hef === undefined;

  const weatherTabs = [
    { key: 'Roadside', station: localWeather },
    { key: 'Regional', station: regionalWeather },
    { key: 'High elevation', station: hef },
  ].filter(tab => !!tab.station);

  const defaultActiveTab = weatherTabs.length ? weatherTabs[0].key : null;
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const hasWeather = !!(localWeather || regionalWeather || hef);

  // Keep active tab valid across direct loads, refreshes, and camera changes.
  useEffect(() => {
    if (!weatherTabs.length) {
      return;
    }

    const tabIsValid = weatherTabs.some(tab => tab.key === activeTab);
    if (!tabIsValid) {
      setActiveTab(weatherTabs[0].key);
    }
  }, [activeTab, weatherTabs]);

  /* Rendering */
  if (isLoading) {
    return (
      <div>
        <Skeleton height={48}/>
        <Skeleton height={600}/>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="nearby-weathers-container">
        <div className="actions-bar actions-bar--weathers">
          <div className="title">
            <p>Nearby Weather</p>
          </div>
        </div>
        <div className="weather-types">
          <ul className="nav nav-tabs">
            {weatherTabs.map(tab => (
              <li className="nav-item" key={tab.key}>
                <button
                  type="button"
                  className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  onKeyDown={keyEvent => {
                    if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                      setActiveTab(tab.key);
                    }
                  }}>
                  <FontAwesomeIcon
                    className="weather-type-icon"
                    icon={WEATHER_TAB_ICONS[tab.key]} />
                  {tab.key}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
        {!hasWeather ? (
          <div className="weather-empty">
            <h3>No nearby weather available</h3>
            <p>
              Unfortunately there is no nearby weather data available for this camera.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'Roadside' && localWeather && (
              <NearbyLocalWeather weather={localWeather} />
            )}

            {activeTab === 'Regional' && regionalWeather && (
              <NearbyRegionalWeather weather={regionalWeather} />
            )}

            {activeTab === 'High elevation' && hef && (
              <NearbyHevWeather weather={hef} />
            )}
          </>
        )}
        </div>
      </div>
    </React.Fragment>
  );
}
