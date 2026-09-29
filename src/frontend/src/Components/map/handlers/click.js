// Internal imports
import { isRestStopClosed } from '../../data/restStops';
import { setEventStyle } from '../helpers';
import trackEvent from '../../shared/TrackEvent';

// Styling
import {
  coastalFerryStyles,
  ferryStyles,
  roadWeatherStyles,
  regionalStyles,
  hefStyles,
  hefWarningStyles,
  restStopStyles,
  restStopClosedStyles,
  restStopTruckStyles,
  restStopTruckClosedStyles,
  routeStyles,
  borderCrossingStyles,
  regionalWarningStyles,
  advisoryStyles,
  wildfireCentroidStyles,
  wildfireAreaStyles,
  dmsEastStyles,
  dmsSouthStyles,
  dmsWestStyles,
  dmsNorthStyles
} from '../../data/featureStyleDefinitions';

let highlighted_camera_list = []

// Click states
export const resetClickedStates = (
  targetFeature,
  clickedFeatureRef,
  updateClickedFeature,
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
        clickedFeatureRef.current.setStyle(
          clickedFeatureRef.current.get('warnings') ?
          hefWarningStyles['static'] :
          hefStyles['static']
        );
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
          const altFeature = clickedFeatureRef.current.get('altFeature');
          if (altFeature) {
            altFeature.setStyle((isCentroid ? wildfireAreaStyles['static'] : wildfireCentroidStyles['static']));
            altFeature.set('clicked', false);
          }

          updateClickedFeature(null);
      }
        break;
      case 'dms':
        switch (clickedFeatureRef.current.get("roadway_direction")) {
            case 'Eastbound':
              clickedFeatureRef.current.setStyle(dmsEastStyles['static']);
              break;
            case 'Southbound':
              clickedFeatureRef.current.setStyle(dmsSouthStyles['static']);
              break;
            case 'Westbound':
              clickedFeatureRef.current.setStyle(dmsWestStyles['static']);
              break;
            case 'Northbound':
              clickedFeatureRef.current.setStyle(dmsNorthStyles['static']);
              break;
          }
        clickedFeatureRef.current.set('clicked', false);
        updateClickedFeature(null);
        break;
    }
  }
};

const camClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
) => {
  if (clickedFeatureRef.current?.values_?.type === 'camera' || clickedFeatureRef.current?.values_?.type !== feature.values_?.type) {
    resetClickedStates(
      feature,
      clickedFeatureRef,
      updateClickedFeature,
    );
  }

  if (highlighted_camera_list.length > 0) {
      resetClickedStates(
      feature,
      highlighted_camera_list[0],
      updateClickedFeature,
    );
    highlighted_camera_list = [];
    highlighted_camera_list.push(feature);
    }

  // set new clicked camera feature
  feature.setCameraStyle('active');
  feature.set('clicked', true, true);
  feature.set('unread', false);
  feature.set('hovered', false);

  updateClickedFeature(feature);
};

export const eventClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
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
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
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
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
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
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
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
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
  );

  // set new clicked hef weather feature
  const warnings = feature.get('warnings');
  feature.setStyle(warnings ? hefWarningStyles['active'] : hefStyles['active']);
  feature.setProperties({ clicked: true }, true);
  updateClickedFeature(feature);
};

const restStopClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
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
  if (clickedFeatureRef.current?.values_?.type !== 'camera') {
      resetClickedStates(
      feature,
      clickedFeatureRef,
      updateClickedFeature,
    );
  }
  else {
    highlighted_camera_list.push(clickedFeatureRef.current);
  }

  // set new clicked route feature
  feature.set('clicked', true);
  feature.setStyle(routeStyles['active']);
};

const borderCrossingClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
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
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
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
) => {
  // reset previous clicked feature
  resetClickedStates(
    feature,
    clickedFeatureRef,
    updateClickedFeature,
  );

  const isCentroidFeature = feature.getGeometry().getType() === 'Point';

  feature.setStyle((isCentroidFeature ? wildfireCentroidStyles['active'] : wildfireAreaStyles['active']));
  feature.set('clicked', true);

  // alt feature
  const altFeature = feature.get('altFeature');
  if (altFeature) {
    altFeature.setStyle((isCentroidFeature ? wildfireAreaStyles['active'] : wildfireCentroidStyles['active']));
    altFeature.set('clicked', true);
  }

  updateClickedFeature(feature);
};


export const pointerClickHandler = (
  features,
  clickedFeatureRef,
  updateClickedFeature,
  mapView,
  updateRouteDisplay,
  mapContext
) => {
  if (features.length) {
    let clickedFeature = features[0];

    const clusterFeatures = clickedFeature.get('features');

    if (clusterFeatures) {
      if (clusterFeatures.length > 1) {
        clusterFeatures.forEach(feature => {
          feature.set('hovered', false);
          feature.set('clicked', false);
          feature.setCameraStyle('static');
        });

        mapView.current.animate({
          center: clickedFeature.getGeometry().getCoordinates(),
          zoom: mapView.current.getZoom() + 2,
          duration: 300,
        });

        return;
      }

      clickedFeature = clusterFeatures[0];
    }

    switch (clickedFeature?.getProperties()['type']) {
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

      case 'dms':
        trackEvent(
          'click',
          'map',
          'dms',
          'selected dms',
        );
        dmsClickHandler(
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
  );
};

export const dmsClickHandler = (
  feature,
  clickedFeatureRef,
  updateClickedFeature,
) => {
  // reset previous clicked feature
  if (clickedFeatureRef.current?.values_?.type !== 'camera') {
      resetClickedStates(
      feature,
      clickedFeatureRef,
      updateClickedFeature,
    );

  }
  else {
    highlighted_camera_list.push(clickedFeatureRef.current);
  }
  if (feature.getProperties().roadway_direction === 'Eastbound') {
    feature.setStyle(dmsEastStyles['active']);
  }
  if (feature.getProperties().roadway_direction === 'Southbound') {
    feature.setStyle(dmsSouthStyles['active']);
  }
  if (feature.getProperties().roadway_direction === 'Westbound') {
    feature.setStyle(dmsWestStyles['active']);
  }
  if (feature.getProperties().roadway_direction === 'Northbound') {
    feature.setStyle(dmsNorthStyles['active']);
  }

  feature.set('clicked', true);
  updateClickedFeature(feature);
};
