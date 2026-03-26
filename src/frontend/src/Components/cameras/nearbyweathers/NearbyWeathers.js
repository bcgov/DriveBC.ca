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
  const [regionalWeather, setRegionalWeather] = useState();
  const [localWeather, setLocalWeather] = useState();
  const [hef, setHef] = useState();

  // States
  const [activeTab, setActiveTab] = useState('Local');

  const btnTitles = [
    camera.local_weather_station && 'Local',
    camera.regional_weather_station && 'Regional',
    camera.hev_station && 'High elevation',
  ].filter(Boolean);

  // Effects

  // if Local has no data once its list has loaded, switch to the first tab that does.
  useEffect(() => {
    if (activeTab !== 'Local') return;
    if (currentWeatherList == null || localWeather) return;

    if (regionalWeather) setActiveTab('Regional');
    else if (hef) setActiveTab('High elevation');
  }, [currentWeatherList, localWeather, regionalWeather, hef, activeTab]);

  // find regional weather and set state
  useEffect(() => {
    if (!regionalWeatherList || !camera.regional_weather_station) {
      if (camera.hef_station) {
        setActiveTab("High elevation");
      }
      else {
        setActiveTab("Local");
      }
      return;
    }

    const station = regionalWeatherList.find(station => station.id === camera.regional_weather_station);
    setRegionalWeather(station);

  }, [regionalWeatherList, camera]);

  // find local weather and set state
  useEffect(() => {
    if (!currentWeatherList || !camera.local_weather_station) {
      if (camera.regional_weather_station) {
        setActiveTab("Regional");
      }
      else {
        setActiveTab("High elevation");
      }  
      return;
    }

    const station = currentWeatherList.find(station => station.id === camera.local_weather_station);
    setLocalWeather(station);

  }, [currentWeatherList, camera]);

  // find hef and set state
  useEffect(() => {
    if (!hefList || !camera.hev_station) {
      if (camera.local_weather_station) {
        setActiveTab("Local");
      }
      else {
        setActiveTab("Regional");
      }  
      return;
    }

    const station = hefList.find(station => station.id === camera.hev_station);
    setHef(station);

  }, [hefList, camera]);

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

        { activeTab === 'Local' && camera.local_weather_station &&
          <NearbyLocalWeather weather={localWeather} />
        }

        { activeTab === 'Regional' && camera.regional_weather_station &&
          <NearbyRegionalWeather weather={regionalWeather} />
        }

        { activeTab === 'High elevation' && camera.hef_station && 
          <NearbyHevWeather weather={hef} />
        }
      </div>
    </React.Fragment>
  );
}
