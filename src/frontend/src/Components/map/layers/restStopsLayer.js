// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { restStopStyles, restStopClosedStyles, restStopTruckStyles, restStopTruckClosedStyles } from '../../data/featureStyleDefinitions.js';
import { isRestStopClosed } from '../../data/restStops.js';

const getRestStopStyle = (restStop) => {
  const isClosed = isRestStopClosed(restStop.properties);
  const isLargeVehiclesAccommodated = restStop.properties.ACCOM_COMMERCIAL_TRUCKS === 'Yes'? true: false;
  if(isClosed){
    if(isLargeVehiclesAccommodated){
      return restStopTruckClosedStyles['static'];
    }
    else{
      return restStopClosedStyles['static'];
    }
  }
  else{
    if(isLargeVehiclesAccommodated){
      return restStopTruckStyles['static'];
    }
    else{
      return restStopStyles['static'];
    }
  }
}

export function getRestStopsLayer(restStopsData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  const vectorSource = new VectorSource();

  restStopsData.forEach(restStop => {
    // Offset rest stops ~250m to prevent overlapping with others
    let lat = restStop.location.coordinates[0];
    if (restStop.properties.DIRECTION_OF_TRAFFIC == 'Eastbound') {
      lat += 0.0022;
    }
    if (restStop.properties.DIRECTION_OF_TRAFFIC == 'Westbound') {
      lat -= 0.0022;
    }

    let lng = restStop.location.coordinates[1];
    if (restStop.properties.DIRECTION_OF_TRAFFIC == 'Northbound') {
      lng += 0.0022;
    }
    if (restStop.properties.DIRECTION_OF_TRAFFIC == 'Southbound') {
      lng -= 0.0022;
    }

    const olGeometry = new Point([lat, lng]);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'restStop' });

    // Transfer properties
    olFeature.setProperties(restStop);

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );

    olFeatureForMap.setStyle(getRestStopStyle(restStop));

    // feature ID to stop ID for retrieval
    olFeatureForMap.setId(restStop.id);

    vectorSource.addFeature(olFeatureForMap);

    if (referenceData?.type === 'restStop' || referenceData?.type === 'largeRestStop') {
      // Update the reference feature if id is the reference
      if (restStop.id == referenceData.id) {  // Intentional loose equality for string IDs
        updateReferenceFeature(olFeatureForMap);
      }
    }
  });

  return new VectorLayer({
    classname: 'restStops',
    visible: mapContext.visible_layers.restStops,
    source: vectorSource,
    style: () => null
  });
}

export function updateRestStopsLayer(restStops, layer, setLoadingLayers) {
  const restStopsDict = restStops.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const restStopFeature of layer.getSource().getFeatures()) {
    if (!restStopFeature.getProperties()['clicked']) {
      restStopFeature.setStyle(restStopsDict[restStopFeature.getId()] ? getRestStopStyle(restStopFeature.getProperties()) : new Style(null));
    }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    restStops: false
  }));
}
