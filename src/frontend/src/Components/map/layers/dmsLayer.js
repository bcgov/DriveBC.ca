// Components and functions
import { transformFeature } from '../helpers/index.js';

// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { dmsEastStyles, dmsSouthStyles, dmsWestStyles, dmsNorthStyles } from '../../data/featureStyleDefinitions.js';


const getDmsStyle = (dms) => {
  if (dms.roadway_direction === 'Eastbound') {
    return dmsEastStyles['static'];
  }
  if (dms.roadway_direction === 'Southbound') {
    return dmsSouthStyles['static'];
  }
  if (dms.roadway_direction === 'Westbound') {
    return dmsWestStyles['static'];
  }
  if (dms.roadway_direction === 'Northbound') {
    return dmsNorthStyles['static'];
  }
  
}

export function getDmsLayer(dmsData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  const vectorSource = new VectorSource();

  dmsData.forEach(dms => {
    // Offset DMS ~250m to prevent overlapping with others
    let lat = dms.geometry.coordinates[0];
    if (dms.roadway_direction == 'Eastbound') {
      lat += 0.0022;
    }
    if (dms.roadway_direction == 'Westbound') {
      lat -= 0.0022;
    }

    let lng = dms.geometry.coordinates[1];
    if (dms.roadway_direction == 'Northbound') {
      lng += 0.0022;
    }
    if (dms.roadway_direction == 'Southbound') {
      lng -= 0.0022;
    }

    const olGeometry = new Point([lat, lng]);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'dms' });

    const { geometry, ...props } = dms;

    // Transfer properties
    olFeature.setProperties(props);

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );

    olFeatureForMap.setStyle(getDmsStyle(dms));

    // feature ID to stop ID for retrieval
    olFeatureForMap.setId(dms.id);

    vectorSource.addFeature(olFeatureForMap);

    if (referenceData?.type === 'dms') {
      // Update the reference feature if id is the reference
      if (dms.id == referenceData.id) {  // Intentional loose equality for string IDs
        updateReferenceFeature(olFeatureForMap);
      }
    }
  });

  return new VectorLayer({
    classname: 'dms',
    visible: mapContext.visible_layers.dms,
    source: vectorSource,
    style: () => null
  });
}

export function updateDmsLayer(dmsData, layer, setLoadingLayers) {
  const dmsDict = dmsData.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const dmsFeature of layer.getSource().getFeatures()) {
    if (!dmsFeature.getProperties()['clicked']) {
      dmsFeature.setStyle(dmsDict[dmsFeature.getId()] ? getDmsStyle(dmsFeature.getProperties()) : new Style(null));
    }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    dms: false
  }));
}
