// React
import React, { useCallback, useEffect, useState } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// Redux
import { useDispatch, useSelector } from "react-redux";
import { memoize } from "proxy-memoize";

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWind,
  faEye,
  faSunCloud,
  faChevronUp,
  faChevronDown,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faCircleInfo,
  faTriangleExclamation,
} from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";
import Skeleton from "react-loading-skeleton";
import Collapse from 'react-bootstrap/Collapse';

// Internal imports
import ForecastCarousel from '../map/panels/weather/ForecastCarousel';
import ForecastTabs from '../map/panels/weather/ForecastTabs';
import FriendlyTime from '../shared/FriendlyTime';
import ShareURLButton from '../shared/ShareURLButton';
import WeatherIconThin from '../map/WeatherIconThin';

// Styling
import './NearbyWeathers.scss';
import * as FA from "@fortawesome/pro-regular-svg-icons";
import NearbyRegionalWeather from "./NearbyRegionalWeather";
import NearbyLocalWeather from "./NearbyLocalWeather";
import NearbyHevWeather from "./NearbyHevWeather";

// Main component
export default function NearbyWeathers(props) {
  /* Setup */
  // Misc
  const hev_data_sample =  {
    id: "hef_123",
    hwyName: "Highway 99",
    hwyDescription: "Sea to Sky - Squamish to Whistler",
    issued_utc: "2023-11-15T08:30:00Z",
    forecasts: [
      {
        label: "Today",
        icon: "01d",
        summary: "Mainly sunny with high of 8°C. Winds light from the northwest."
      },
      {
        label: "Tonight",
        icon: "04n",
        summary: "Increasing cloudiness with a low of 2°C. 30% chance of flurries after midnight."
      },
      {
        label: "Tomorrow",
        icon: "13d",
        summary: "Periods of light snow. High 4°C. Snowfall amount 2-4cm."
      },
      {
        label: "Tomorrow Night",
        icon: "48",
        summary: "Fog patches developing overnight with a risk of freezing rain. Low -1°C."
      }
    ],
    warnings: {
      Events: [
        {
          Description: "Winter Storm Watch: Heavy snow and freezing rain possible",
          expirytime: "2023-11-16T23:59:00Z",
          Url: "https://weather.gc.ca/warnings/report_e.html?bc42"
        }
      ]
    }
  };

  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

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
  const [hef, setHef] = useState(hev_data_sample);

  // const weather = feature.getProperties();
  // const conditions = weather.conditions;

  // Split forecast into current and future
  // const current_day_forecasts = [];
  // const future_forecasts = [];
  // for (const forecast of weather.forecast_group) {
  //   if (forecast.Period.TextForecastName == 'Today' || forecast.Period.TextForecastName == 'Tonight') {
  //     current_day_forecasts.push(forecast);
  //
  //   } else {
  //     future_forecasts.push(forecast);
  //   }
  //
  //   weather.current_day_forecasts = current_day_forecasts;
  //   weather.future_forecasts = future_forecasts;
  // }

  // Navigation
  const [searchParams, setSearchParams] = useSearchParams();

  // States
  const [activeTab, setActiveTab] = useState('Regional');
  const [expanded, setExpanded] = useState(false);

  // Effects
  // find regional weather and set state
  useEffect(() => {
    if (!regionalWeatherList || !camera.regional_weather_station) {
      return;
    }

    const station = regionalWeatherList.find(station => station.id === camera.regional_weather_station);
    setRegionalWeather(station);
    console.log('regional station: ', station);

  }, [regionalWeatherList]);

  // find local weather and set state
  useEffect(() => {
    if (!currentWeatherList || !camera.local_weather_station) {
      return;
    }

    const station = currentWeatherList.find(station => station.id === camera.local_weather_station);
    setLocalWeather(station);
    console.log('local station: ', station);

  }, [currentWeatherList]);

  // find hef and set state
  useEffect(() => {
    if (!hefList || !camera.hef_station) {
      return;
    }

    const station = hefList.find(station => station.id === camera.hef_station);
    setHef(station);
    console.log('hev station: ', station);

  }, [hefList]);

  /* Rendering */
  // Main component
  if (!regionalWeather && !localWeather && !hef) {
    return <Skeleton />;
  }

  const btnTitles = ['Regional', 'Local', 'High elevation'];

  return (
    <div>
      <div>
        <FontAwesomeIcon className="weather-icon" icon={FA.faSunCloud}/>
        Weather

        {[regionalWeather, localWeather, hef].map((station, index) => {
          if (!station) {
            return null;
          }

          return (
            <button
              key={index}
              onClick={() => setActiveTab(btnTitles[index])}
              onKeyDown={keyEvent => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  setActiveTab(btnTitles[index]);
                }
              }}
              className="btn btn-outline-primary">

              {btnTitles[index]}
            </button>
          );
        })}
      </div>

      {regionalWeather && activeTab === 'Regional' &&
        <NearbyRegionalWeather weather={regionalWeather} />
      }

      {localWeather && activeTab === 'Local' &&
        <NearbyLocalWeather weather={localWeather} />
      }

      {hef && activeTab === 'High elevation' &&
        <NearbyHevWeather weather={hef} />
      }
    </div>
  );
}
