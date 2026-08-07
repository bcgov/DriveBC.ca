import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as FA from '@fortawesome/pro-thin-svg-icons';

// Environment Canada icon code to weather condition icon mapping
const ICONS = {
  "0": FA.faSun,
  "4": FA.faSunHaze,
  "5": FA.faCloudFog,
  "10": FA.faCloudFog,
  "20": FA.faFog,
  "21": FA.faCloudRain,
  "22": FA.faCloudShowers,
  "23": FA.faCloudShowers,
  "24": FA.faSnowflake,
  "30": FA.faFog,
  "31": FA.faFog,
  "32": FA.faFog,
  "33": FA.faFog,
  "34": FA.faFog,
  "40": FA.faCloudRain,
  "41": FA.faCloudRain,
  "42": FA.faCloudRain,
  "50": FA.faCloudShowers,
  "51": FA.faCloudShowers,
  "52": FA.faCloudShowers,
  "53": FA.faCloudShowersHeavy,
  "60": FA.faCloudRain,
  "61": FA.faCloudRain,
  "62": FA.faCloudRain,
  "63": FA.faCloudRain,
  "67": FA.faCloudSleet,
  "68": FA.faCloudSleet,
  "70": FA.faSnowflake,
  "71": FA.faSnowflake,
  "72": FA.faSnowflake,
  "73": FA.faSnowflakes,
  "80": FA.faCloudShowers,
  "81": FA.faCloudShowers,
  "82": FA.faCloudShowers,
  "83": FA.faCloudShowersHeavy,
  "84": FA.faCloudShowersHeavy,
  "85": FA.faSnowflake,
  "86": FA.faSnowflake,
  "87": FA.faSnowflakes,
  "89": FA.faCloudHail,
}

export default function WeatherIconThin({code, className}) {

  if (ICONS[code]) {
    return <FontAwesomeIcon className={className} icon={ICONS[code]} />;
  }

  // default to generic sun cloud icon
  return <FontAwesomeIcon className="weather-icon" icon={FA.faSunCloud} />;
}
