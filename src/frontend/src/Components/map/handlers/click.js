// External imports
import { fromLonLat } from "ol/proj";

// Internal imports
import { isRestStopClosed } from '../../data/restStops.js';
import { setEventStyle, setZoomPan } from '../helpers';
import trackEvent from '../../shared/TrackEvent.js';

// Styling
import {
  coastalFerryStyles,
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
  regionalWarningStyles,
  advisoryStyles,
  wildfireCentroidStyles,
  wildfireAreaStyles
} from '../../data/featureStyleDefinitions.js';

// Click states
export const resetClickedStates = (
  targetFeature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // No features were clicked before, do nothing
  if (!clickedFeatureRef.current) {
    return;
  }

  // Workaround for the case where advisories are clicked
  if (!clickedFeatureRef.current.get) {
    updateClickedFeature(null);
    return;
  }

  // Reset feature if target feature does not equal to it or its altFeature
  if (
    !targetFeature ||
    (targetFeature != clickedFeatureRef.current &&
      targetFeature != clickedFeatureRef.current.get('altFeature'))
  ) {
    switch (clickedFeatureRef.current.get('type')) {
      case 'camera':
        clickedFeatureRef.current.setCameraStyle('static');
        clickedFeatureRef.current.set('clicked', false);
        updateClickedFeature(null);
        break;
      case 'event': {
        setEventStyle(clickedFeatureRef.current, 'static');
        setEventStyle(
          clickedFeatureRef.current.get('altFeature') || [],
          'static',
        );
        clickedFeatureRef.current.set('clicked', false);

        // Set alt feature to not clicked
        const altFeatureList = clickedFeatureRef.current.get('altFeature');
        if (altFeatureList) {
          const altFeature =
            altFeatureList instanceof Array
              ? altFeatureList[0]
              : altFeatureList;
          altFeature.set('clicked', false);
        }

        updateClickedFeature(null);
        break;
      }
      case 'ferry':
        {
          const styles = clickedFeatureRef.current.get('coastal') ? coastalFerryStyles : ferryStyles;
          clickedFeatureRef.current.setStyle(styles['static']);
          clickedFeatureRef.current.set('clicked', false);
          updateClickedFeature(null);
        }
        break;
      case 'currentWeather':
        clickedFeatureRef.current.setStyle(roadWeatherStyles['static']);
        clickedFeatureRef.current.set('clicked', false);
        updateClickedFeature(null);
        break;
      case 'regionalWeather':
        clickedFeatureRef.current.setStyle(
          clickedFeatureRef.current.get('warnings') ?
          regionalWarningStyles['static'] :
          regionalStyles['static']
        );
        clickedFeatureRef.current.set('clicked', false);
        updateClickedFeature(null);
        break;
      case 'hef':
        clickedFeatureRef.current.setStyle(hefStyles['static']);
        clickedFeatureRef.current.set('clicked', false);
        updateClickedFeature(null);
        break;
      case 'largeRestStop':
      case 'restStop': {
        const isClosed = isRestStopClosed(
          clickedFeatureRef.current.values_.properties,
        );
        const isLargeVehiclesAccommodated =
          clickedFeatureRef.current.values_.properties
            .ACCOM_COMMERCIAL_TRUCKS === 'Yes'
            ? true
            : false;
        if (isClosed) {
          if (isLargeVehiclesAccommodated) {
            clickedFeatureRef.current.setStyle(
              restStopTruckClosedStyles['static'],
            );
          } else {
            clickedFeatureRef.current.setStyle(restStopClosedStyles['static']);
          }
        } else {
          if (isLargeVehiclesAccommodated) {
            clickedFeatureRef.current.setStyle(restStopTruckStyles['static']);
          } else {
            clickedFeatureRef.current.setStyle(restStopStyles['static']);
          }
        }
        clickedFeatureRef.current.set('clicked', false);
        updateClickedFeature(null);
        break;
      }
      case 'borderCrossing':
        clickedFeatureRef.current.setStyle(borderCrossingStyles['static']);
        clickedFeatureRef.current.set('clicked', false);
        updateClickedFeature(null);
        break;
      case 'advisory':
        clickedFeatureRef.current.setStyle(advisoryStyles['static']);
        clickedFeatureRef.current.set('clicked', false);
        updateClickedFeature(null);
        break;
      case 'wildfire':
        {
          const isCentroid = clickedFeatureRef.current.getGeometry().getType() === 'Point';
          clickedFeatureRef.current.setStyle((isCentroid ? wildfireCentroidStyles['static'] : wildfireAreaStyles['static']));
          clickedFeatureRef.current.set('clicked', false);

          // Alt feature
          clickedFeatureRef.current.get('altFeature').setStyle((isCentroid ? wildfireAreaStyles['static'] : wildfireCentroidStyles['static']));
          clickedFeatureRef.current.get('altFeature').set('clicked', false);

          updateClickedFeature(null);
      }
        break;
    }
  }
};

const getVisibleNearbyObjectsCount = (mapContext, feature) => {
  const layers = ['closures', 'majorEvents', 'minorEvents', 'futureEvents', 'roadConditions', 'chainUps', 'weather'];

  let count = feature.get('nearby_objs').cameras;
  for (const layer of layers) {
    if (mapContext.visible_layers[layer] && feature.get('nearby_objs')[layer]) {
      count += feature.get('nearby_objs')[layer];
    }
  }

  return count;
}

const getDefaultZoom = (nearbyCount) => {
  if (nearbyCount > 2) {
    return 13.5;
  }

  if (nearbyCount > 0) {
    return 12;
  }

  return 9;
}

const camClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  mapView,
  isCamDetail,
  loadCamDetails,
  updateReferenceFeature,
  mapContext
) => {
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  // set new clicked camera feature
  feature.setCameraStyle('active');
  feature.set('clicked', true, true);
  feature.set('unread', false);

  updateClickedFeature(feature);

  if (isCamDetail) {
    if (feature.get('focusCamera')) {
      const zoom = feature.get('zoom');
      const pan = feature.get('pan');

      const nearbyCount = getVisibleNearbyObjectsCount(mapContext, feature);
      setZoomPan(
        mapView,
        zoom ? zoom : getDefaultZoom(nearbyCount),
        pan ? fromLonLat(pan.split(",").map(Number)) : feature.getGeometry().getCoordinates()
      );

      feature.unset('focusCamera');

    } else {
      setZoomPan(mapView, null, feature.getGeometry().getCoordinates());
      loadCamDetails(feature.getProperties());
    }

    updateReferenceFeature(feature);
  }
};

export const eventClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  // set new clicked event feature
  setEventStyle(feature, 'active');
  setEventStyle(feature.get('altFeature') || [], 'active');
  feature.set('clicked', true);

  // Set alt feature to clicked
  const altFeatureList = feature.get('altFeature');
  if (altFeatureList) {
    const altFeature =
      altFeatureList instanceof Array ? altFeatureList[0] : altFeatureList;
    altFeature.set('clicked', true);
  }

  updateClickedFeature(feature);
};

export const ferryClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  const styles = feature.get('coastal') ? coastalFerryStyles : ferryStyles;

  // set new clicked ferry feature
  feature.setStyle(styles['active']);
  feature.setProperties({ clicked: true }, true);
  updateClickedFeature(feature);
};

const weatherClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  // set new clicked local weather feature
  feature.setStyle(roadWeatherStyles['active']);
  feature.setProperties({ clicked: true }, true);
  updateClickedFeature(feature);
};

const regionalClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  // set new clicked regional weather feature
  const warnings = feature.get('warnings');
  feature.setStyle(warnings ? regionalWarningStyles['active'] : regionalStyles['active']);
  feature.setProperties({ clicked: true }, true);
  updateClickedFeature(feature);
};

const hefClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  // set new clicked hef weather feature
  feature.setStyle(hefStyles['active']);
  feature.setProperties({ clicked: true }, true);
  updateClickedFeature(feature);
};

const restStopClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  // set new clicked rest stop feature
  const isClosed = isRestStopClosed(feature.values_.properties);
  const isLargeVehiclesAccommodated =
    feature.values_.properties.ACCOM_COMMERCIAL_TRUCKS === 'Yes' ? true : false;
  if (isClosed) {
    if (isLargeVehiclesAccommodated) {
      feature.setStyle(restStopTruckClosedStyles['active']);
    } else {
      feature.setStyle(restStopClosedStyles['active']);
    }
  } else {
    if (isLargeVehiclesAccommodated) {
      feature.setStyle(restStopTruckStyles['active']);
    } else {
      feature.setStyle(restStopStyles['active']);
    }
  }
  feature.setProperties({ clicked: true }, true);
  updateClickedFeature(feature);
};

const routeClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    false,
  );

  // set new clicked route feature
  feature.set('clicked', true);
  feature.setStyle(routeStyles['active']);
};

const borderCrossingClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  // set new clicked border crossing feature
  feature.setStyle(borderCrossingStyles['active']);
  feature.setProperties({ clicked: true }, true);
  updateClickedFeature(feature);
};

export const advisoryClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  // set new clicked advisory feature
  feature.setStyle(advisoryStyles['active']);
  feature.setProperties({ clicked: true }, true);
  updateClickedFeature(feature);
};

export const wildfireClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
  isCamDetail,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );

  const isCentroidFeature = feature.getGeometry().getType() === 'Point';

  feature.setStyle((isCentroidFeature ? wildfireCentroidStyles['active'] : wildfireAreaStyles['active']));
  feature.set('clicked', true);

  // alt feature
  feature.get('altFeature').setStyle((isCentroidFeature ? wildfireAreaStyles['active'] : wildfireCentroidStyles['active']));
  feature.get('altFeature').set('clicked', true);

  updateClickedFeature(feature);
};


export const pointerClickHandler = (
  features,
  clickedFeatureRef,
  updateClickedFeature,
  mapView,
  isCamDetail,
  loadCamDetails,
  updateReferenceFeature,
  updateRouteDisplay,
  mapContext
) => {
  if (features.length) {
    const clickedFeature = features[0];
    switch (clickedFeature.getProperties()['type']) {
      case 'camera':
        trackEvent(
          'click',
          'map',
          'camera',
          clickedFeature.getProperties().name,
        );
        camClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
          mapView,
          isCamDetail,
          loadCamDetails,
          updateReferenceFeature,
          mapContext
        );
        return;

      case 'event':
        trackEvent(
          'click',
          'map',
          'event',
          clickedFeature.getProperties().display_category,
          clickedFeature.getProperties().id,
        );
        eventClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
          isCamDetail,
        );
        return;

      case 'ferry':
        trackEvent(
          'click',
          'map',
          'ferry',
          clickedFeature.getProperties().title,
        );
        ferryClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
          isCamDetail,
        );
        return;

      case 'currentWeather':
        trackEvent(
          'click',
          'map',
          'weather',
          clickedFeature.getProperties().weather_station_name,
        );
        weatherClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
          isCamDetail,
        );
        return;

      case 'regionalWeather':
        trackEvent(
          'click',
          'map',
          'regional weather',
          clickedFeature.getProperties().name,
        );
        regionalClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
          isCamDetail,
        );
        return;

      case 'hef':
        trackEvent(
          'click',
          'map',
          'high elevation forecast',
          clickedFeature.getProperties().name,
        );
        hefClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
          isCamDetail,
        );
        return;

      case 'largeRestStop':
      case 'restStop':
        trackEvent(
          'click',
          'map',
          'rest stop',
          clickedFeature.getProperties().properties.REST_AREA_NAME,
        );
        restStopClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
          isCamDetail,
        );
        if (clickedFeature.getProperties().type === 'largeRestStop') {
          const currentUrl = window.location.href;
          const newUrl = currentUrl.replace("restStop", "largeRestStop");
          window.history.replaceState(null, "", newUrl);
          mapContext.visible_layers.restStops = false;
          mapContext.visible_layers.largeRestStops = true;
        }
        return;

      case 'route':
        trackEvent(
          'click',
          'map',
          'route',
          'selected route',
        );
        routeClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
        );

        updateRouteDisplay(clickedFeature.get('route'));
        return;

      case 'borderCrossing':
        trackEvent(
          'click',
          'map',
          'border crossing',
          'selected border crossing',
        );
        borderCrossingClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
        );
        return;

      case 'advisory':
        trackEvent(
          'click',
          'map',
          'advisory',
          'selected advisory',
        );
        advisoryClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
        );
        return;

      case 'wildfire':
        trackEvent(
          'click',
          'map',
          'wildfire',
          'selected wildfire',
        );
        wildfireClickHandler(
          clickedFeature,
          clickedFeatureRef,
          updateClickedFeature,
        );
        return;

      default:
        return;
    }
  }

  // Close popups if clicked on blank space
  resetClickedStates(
    null,
    clickedFeatureRef,
    updateClickedFeature,
    isCamDetail,
  );
};
