// React
import React from 'react';

export const getCameraOrientation = (orientation) => {
  switch (orientation) {
    case 'N':
      return 'North facing camera';
    case 'W':
      return 'West facing camera';
    case 'E':
      return 'East facing camera';
    case 'S':
      return 'South facing camera';
    case 'NE':
      return 'North East facing camera';
    case 'NW':
      return 'North West facing camera';
    case 'SE':
      return 'South East facing camera';
    case 'SW':
      return 'South West facing camera';
    case 'NONE':
      return ' ';
    default:
      return ' ';
  }
}