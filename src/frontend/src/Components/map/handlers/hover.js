import {
  cameraStyles,
  ferryStyles,
  roadWeatherStyles,
  regionalStyles,
  hefStyles,
  restStopStyles,
  restStopClosedStyles,
  restStopTruckStyles,
  restStopTruckClosedStyles,
  routeStyles,
  borderCrossingStyles,
  regionalWarningStyles
} from '../../data/featureStyleDefinitions.js';
import {
  setEventStyle
} from '../helpers';
import { isRestStopClosed } from '../../data/restStops.js';

export const resetHoveredStates = (targetFeature, hoveredFeatureRef) => {
  let hoveredFeature = hoveredFeatureRef.current;

  // Reset feature if target isn't clicked
  if (hoveredFeature && targetFeature != hoveredFeature) {
    if (!hoveredFeature.getProperties().clicked) {
      switch (hoveredFeature.getProperties()['type']) {
        case 'camera':
          hoveredFeature.setStyle(cameraStyles['static']);
          break;
        case 'event': {
          // Reset feature if alt feature also isn't clicked
          const altFeatureList = hoveredFeature.get('altFeature');
          if (altFeatureList) {
            const altFeature = altFeatureList instanceof Array ? altFeatureList[0] : altFeatureList;
            if (!altFeature.getProperties().clicked) {
              setEventStyle(hoveredFeature, 'static');
              setEventStyle(hoveredFeature.get('altFeature') || [], 'static');
            }
          }
          break;
        }
        case 'ferry':
          hoveredFeature.setStyle(ferryStyles['static']);
          break;
        case 'currentWeather':
          hoveredFeature.setStyle(roadWeatherStyles['static']);
          break;
        case 'regionalWeather':
          hoveredFeature.setStyle(
            (hoveredFeature.get('warnings') && hoveredFeature.get('warnings').length) ?
            regionalWarningStyles['static'] :
            regionalStyles['static']
          );
          break;
        case 'hef':
          hoveredFeature.setStyle(hefStyles['static']);
          break;
        case 'largeRestStop':
        case 'restStop':
          {
            const isClosed = isRestStopClosed(
              hoveredFeature.values_.properties,
            );
            const isLargeVehiclesAccommodated =
              hoveredFeature.values_.properties
                .ACCOM_COMMERCIAL_TRUCKS === 'Yes'
                ? true
                : false;
            if (isClosed) {
              if (isLargeVehiclesAccommodated) {
                hoveredFeature.setStyle(
                  restStopTruckClosedStyles['static'],
                );
              } else {
                hoveredFeature.setStyle(
                  restStopClosedStyles['static'],
                );
              }
            } else {
              if (isLargeVehiclesAccommodated) {
                hoveredFeature.setStyle(
                  restStopTruckStyles['static'],
                );
              } else {
                hoveredFeature.setStyle(restStopStyles['static']);
              }
            }
          }
          break;
        case 'route':
          hoveredFeature.setStyle(routeStyles['static']);
          break;
        case 'borderCrossing':
          hoveredFeature.setStyle(borderCrossingStyles['static']);
          break;
      }
    }

    hoveredFeature = null;
  }
};

export const pointerMoveHandler = (e, mapRef, hoveredFeature) => {
  const features = mapRef.current.getFeaturesAtPixel(e.pixel, {
    hitTolerance: 20,
  });

  if (features.length) {
    const targetFeature = features[0];
    resetHoveredStates(targetFeature, hoveredFeature);
    hoveredFeature.current = targetFeature;

    // Set hover style if feature isn't clicked
    switch (targetFeature.getProperties()['type']) {
      case 'camera':
        if (!targetFeature.getProperties().clicked) {
          targetFeature.setStyle(cameraStyles['hover']);
        }
        return;
      case 'event':
        if (!targetFeature.getProperties().clicked) {
          setEventStyle(targetFeature, 'hover');

          // Set alt feature style if it isn't clicked
          const altFeatureList = targetFeature.get('altFeature');
          if (altFeatureList) {
            const altFeature = altFeatureList instanceof Array ? altFeatureList[0] : altFeatureList;
            if (!altFeature.getProperties().clicked) {
              setEventStyle(altFeature, 'hover');
            }
          }
        }
        return;
      case 'ferry':
        if (!targetFeature.getProperties().clicked) {
          targetFeature.setStyle(ferryStyles['hover']);
        }
        return;
      case 'currentWeather':
        if (!targetFeature.getProperties().clicked) {
          targetFeature.setStyle(roadWeatherStyles['hover']);
        }
        return;
      case 'regionalWeather':
        if (!targetFeature.getProperties().clicked) {
          const warnings = targetFeature.get('warnings');
          targetFeature.setStyle((warnings && warnings.length) ? regionalWarningStyles['hover'] : regionalStyles['hover']);
        }
        return;
      case 'hef':
        if (!targetFeature.getProperties().clicked) {
          targetFeature.setStyle(hefStyles['hover']);
        }
        return;
      case 'largeRestStop':
      case 'restStop':
        if (!targetFeature.getProperties().clicked) {
          const isClosed = isRestStopClosed(
            targetFeature.values_.properties,
          );
          const isLargeVehiclesAccommodated =
            targetFeature.values_.properties.ACCOM_COMMERCIAL_TRUCKS ===
            'Yes'
              ? true
              : false;
          if (isClosed) {
            if (isLargeVehiclesAccommodated) {
              targetFeature.setStyle(restStopTruckClosedStyles['hover']);
            } else {
              targetFeature.setStyle(restStopClosedStyles['hover']);
            }
          } else {
            if (isLargeVehiclesAccommodated) {
              targetFeature.setStyle(restStopTruckStyles['hover']);
            } else {
              targetFeature.setStyle(restStopStyles['hover']);
            }
          }
        }
        return;
      case 'route':
        if (!targetFeature.getProperties().clicked) {
          targetFeature.setStyle(routeStyles['hover']);
        }
        return;
      case 'borderCrossing':
        if (!targetFeature.getProperties().clicked) {
          targetFeature.setStyle(borderCrossingStyles['hover']);
        }
        return;
    }
  }

  // Reset on blank space
  resetHoveredStates(null, hoveredFeature);
};
