// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point, Polygon, MultiPolygon } from 'ol/geom';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style } from 'ol/style';

// Styling
import {
  wildfireAreaStyles,
  wildfireCentroidStyles,
  // wildfireUnreadStyles
} from '../../data/featureStyleDefinitions.js';

export function getWildfiresLayer(
  wildfiresList,
  projectionCode,
  mapContext,
  referenceData,
  updateReferenceFeature,
) {

  const vectorSource = new VectorSource();
  wildfiresList.forEach(wildfire => {
    // Location feature
    const locationFeature = new ol.Feature({ geometry: new Point(wildfire.location.coordinates), type: 'wildfire' });

    // Transfer properties
    locationFeature.set('data', wildfire);

    // Transform the projection
    const locationFeatureForMap = transformFeature(
      locationFeature,
      'EPSG:4326',
      projectionCode,
    );

    // feature ID to advisory ID for retrieval
    locationFeatureForMap.setId(wildfire.id.toString() + '-location');

    // Area feature
    const isPolygon = wildfire.geometry.type === 'Polygon'
    const olGeometry = isPolygon ?
      new Polygon(wildfire.geometry.coordinates) :
      new MultiPolygon(wildfire.geometry.coordinates);

    const areaFeature = new ol.Feature({ geometry: olGeometry, type: 'wildfire' });

    // Transfer properties
    areaFeature.set('data', wildfire);

    // Transform the projection
    const areaFeatureForMap = transformFeature(
      areaFeature,
      'EPSG:4326',
      projectionCode,
    );

    // feature ID to advisory ID for retrieval
    areaFeatureForMap.setId(wildfire.id.toString() + '-area');

    // Set reference to each other and add to vector source
    locationFeatureForMap.set('altFeature', areaFeatureForMap);
    areaFeatureForMap.set('altFeature', locationFeatureForMap);
    vectorSource.addFeature(locationFeatureForMap);
    vectorSource.addFeature(areaFeatureForMap);

    // Update the reference feature if id is the reference
    if (referenceData?.type === 'wildfire') {
      if (wildfire.id == referenceData.id) {  // Intentional loose equality for string IDs
        updateReferenceFeature(areaFeatureForMap);
        updateReferenceFeature(locationFeatureForMap);
      }
    }
  });

  return new VectorLayer({
    classname: 'wildfires',
    visible: mapContext.visible_layers.wildfires,
    source: vectorSource,
    style: () => null
  });
}

export function updateWildfiresLayer(wildfiresList, layer, setLoadingLayers) {
  const wildfiresDict = wildfiresList.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  const featuresDict = {};

  for (const wildfiresFeature of layer.getSource().getFeatures()) {
    const wildfire = wildfiresDict[wildfiresFeature.get('data').id];

    if (!wildfire) {  // wildfire no longer in list from API
      wildfiresFeature.setStyle(new Style(null));
      continue;
    }

    if (!wildfiresFeature.getProperties()['clicked']) {
      const geometry = wildfiresFeature.getGeometry();
      // Centroid features
      if (geometry.getType() === 'Point') {
        // if (wildfiresFeature.get('data').modified_at !== wildfire.modified_at) {
        //   wildfiresFeature.setStyle(wildfireUnreadStyles['static']);
        //
        // } else {
        //   wildfiresFeature.setStyle(wildfireCentroidStyles['static']);
        // }

        wildfiresFeature.setStyle(wildfireCentroidStyles['static']);

      // Area features
      } else {
        wildfiresFeature.setStyle(wildfireAreaStyles['static']);
      }
    }

    featuresDict[wildfiresFeature.get('data').id] = wildfiresFeature;
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    wildfires: false
  }));

  return featuresDict;
}
