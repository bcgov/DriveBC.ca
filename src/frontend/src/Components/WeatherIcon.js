import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as FA from '@fortawesome/pro-solid-svg-icons';

// Environment Canada icon code to weather condition icon mapping
const ICONS = {
  "00": FA.faSun,
  "01": FA.faSun,
  "02": FA.faSunCloud,
  "03": FA.faCloudsSun,
  "06": FA.faCloudShowers,
  "07": FA.faCloudSleet,
  "08": FA.faCloudSnow,
  "10": FA.faClouds,
  "11": FA.faCloudRain,
  "12": FA.faCloudShowersHeavy,
  "13": FA.faCloudShowersHeavy,
  "14": FA.faCloudHailMixed,
  "15": FA.faCloudSleet,
  "16": FA.faSnowflake,
  "17": FA.faSnowflake,
  "18": FA.faSnowflake,
  "19": FA.faCloudBolt,
  "23": FA.faSunHaze,
  "24": FA.faCloudFog,
  "25": FA.faSnowBlowing,
  "26": FA.faIcicles,
  "27": FA.faCloudHail,
  "28": FA.faCloudHailMixed,
  "30": FA.faMoonStars,
  "31": FA.faMoon,
  "32": FA.faMoonCloud,
  "33": FA.faCloudsMoon,
  "36": FA.faCloudMoonRain,
  "37": FA.faCloudMoonRain,
  "38": FA.faMoonCloud,
  "39": FA.faCloudBolt,
  "40": FA.faSnowBlowing,
  "41": FA.faTornado,
  "42": FA.faTornado,
  "43": FA.faWind,
  "44": FA.faSmoke,
  "45": FA.faSun,  // custom
  "46": FA.faCloudBolt,
  "47": FA.faSun,  // custom
  "48": FA.faSun,  // custom
}

export default function WeatherIcon({code, className}) {
  if (['45', '47', '48'].includes(code)) {
    // FIXME: replace with custom SVGs from design
    return <FontAwesomeIcon className={className} icon={FA.faSun} />;
  } else if (ICONS[code]) {
    return <FontAwesomeIcon className={className} icon={ICONS[code]} />;
  }

  // default to generic sun cloud icon
  <FontAwesomeIcon className="weather-icon" icon={FA.faSunCloud} />
}
