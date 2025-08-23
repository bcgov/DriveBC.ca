// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { restStopTruckStyles, restStopTruckClosedStyles } from '../../data/featureStyleDefinitions.js';
import { isRestStopClosed } from '../../data/restStops.js';

const getLargeRestStopStyle = (restStop) => {
  const isClosed = isRestStopClosed(restStop.properties);
  return isClosed ? restStopTruckClosedStyles['static'] : restStopTruckStyles['static'];
}

export function getLargeRestStopsLayer(restStopsData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  const vectorSource = new VectorSource();

  for (const restStop of restStopsData) {
    const isLargeVehiclesAccommodated = restStop.properties.ACCOM_COMMERCIAL_TRUCKS === 'Yes'? true: false;

    if(!isLargeVehiclesAccommodated){
      continue;
    }

    // Build a new OpenLayers feature
    const olGeometry = new Point(restStop.location.coordinates);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'largeRestStop' });

    // Transfer properties
    olFeature.setProperties(restStop);

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );

    olFeatureForMap.setStyle(getLargeRestStopStyle(restStop));

    // feature ID to stop ID for retrieval
    olFeatureForMap.setId(restStop.id);

    vectorSource.addFeature(olFeatureForMap);

    if (referenceData?.type === 'largeRestStop') {
      // Update the reference feature if id is the reference
      if (restStop.id == referenceData.id) {  // Intentional loose equality for string IDs
        updateReferenceFeature(olFeatureForMap);
      }
    }
  }

  return new VectorLayer({
    classname: 'largeRestStops',
    visible: mapContext.visible_layers.largeRestStops,
    source: vectorSource,
    style: () => null
  });
}


export function updateLargeRestStopsLayer(restStops, layer, setLoadingLayers) {
  const restStopsDict = restStops.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const restStopFeature of layer.getSource().getFeatures()) {
    if(!restStopFeature.getProperties()['clicked']){
      restStopFeature.setStyle(restStopsDict[restStopFeature.getId()] ? getLargeRestStopStyle(restStopFeature.getProperties()) : new Style(null));
    }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    restStops: false
  }));
}
