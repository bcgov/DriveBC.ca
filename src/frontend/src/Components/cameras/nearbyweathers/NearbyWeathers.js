// React
import React, { useCallback, useEffect, useState } from 'react';

// Redux
import { memoize } from "proxy-memoize";
import { useSelector } from "react-redux";

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as FA from "@fortawesome/pro-regular-svg-icons";
import Skeleton from "react-loading-skeleton";
import Button from "react-bootstrap/Button";

// Internal imports
import NearbyRegionalWeather from "./NearbyRegionalWeather";
import NearbyLocalWeather from "./NearbyLocalWeather";
import NearbyHevWeather from "./NearbyHevWeather";

// Styling
import './NearbyWeathers.scss';

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

  // States
  const [localWeather, setLocalWeather] = useState();
  const [regionalWeather, setRegionalWeather] = useState();
  const [hef, setHef] = useState();

  // States
  const [activeTab, setActiveTab] = useState('Local');

  // Effects
  // find regional weather and set state
  useEffect(() => {
    if (!regionalWeatherList || !camera.regional_weather_station) {
      return;
    }

    const station = regionalWeatherList.find(station => station.id === camera.regional_weather_station);
    setRegionalWeather(station);

  }, [regionalWeatherList]);

  // find local weather and set state
  useEffect(() => {
    if (!currentWeatherList || !camera.local_weather_station) {
      return;
    }

    const station = currentWeatherList.find(station => station.id === camera.local_weather_station);
    setLocalWeather(station);

  }, [currentWeatherList]);

  // find hef and set state
  useEffect(() => {
    if (!hefList || !camera.hev_station) {
      return;
    }

    const station = hefList.find(station => station.id === camera.hev_station);
    setHef(station);

  }, [hefList]);

  // set active tab based on available data
  useEffect(() => {
    if (localWeather) {
      setActiveTab('Local');
      return;
    }

    if (regionalWeather) {
      setActiveTab('Regional');
      return;
    }

    if (hef) {
      setActiveTab('High elevation');
    }
  }, [localWeather, regionalWeather, hef]);

  /* Rendering */
  // Loading state
  if (!regionalWeather && !localWeather && !hef) {
    return (
      <div>
        <Skeleton height={48}/>
        <Skeleton height={600}/>
      </div>
    );
  }

  // Main component
  const btnTitles = ['Local', 'Regional', 'High elevation'];

  return (
    <React.Fragment>
      <div className="nearby-weathers-container">
        <div className="actions-bar actions-bar--weathers">
          <div className="title">
            <FontAwesomeIcon className="weather-icon" icon={FA.faSunCloud}/>
            <p>Weather</p>
          </div>
          <div className="weather-types">
            {[localWeather, regionalWeather, hef].map((station, index) => {
              if (!station) {
                return null;
              }

              return (
                <Button
                  variant="primary"
                  className={activeTab === btnTitles[index] ? 'current' : ''}
                  key={index}
                  onClick={() => setActiveTab(btnTitles[index])}
                  onKeyDown={keyEvent => {
                    if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                      setActiveTab(btnTitles[index]);
                    }
                  }}>

                  {btnTitles[index]}
                </Button>
              );
            })}
          </div>
        </div>

        {localWeather && activeTab === 'Local' &&
          <NearbyLocalWeather weather={localWeather} />
        }

        {regionalWeather && activeTab === 'Regional' &&
          <NearbyRegionalWeather weather={regionalWeather} />
        }

        {hef && activeTab === 'High elevation' &&
          <NearbyHevWeather weather={hef} />
        }
      </div>
    </React.Fragment>
  );
}
