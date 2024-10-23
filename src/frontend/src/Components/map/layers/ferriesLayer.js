// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { ferryStyles } from '../../data/featureStyleDefinitions.js';

export function getFerriesLayer(ferriesData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  const vectorSource = new VectorSource();

  ferriesData.forEach(ferry => {
    // Offset ~500m East to prevent overlapping with other features
    const lat = ferry.location.coordinates[0] + 0.0044;
    const lng = ferry.location.coordinates[1]
    const olGeometry = new Point([lat, lng]);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'ferry'});

    // Transfer properties
    olFeature.setProperties(ferry);

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );

    // feature ID to ferry ID for retrieval
    olFeatureForMap.setId(ferry.id);

    vectorSource.addFeature(olFeatureForMap);

    if (referenceData?.type === 'ferry') {
      // Update the reference feature if id is the reference
      if (ferry.id == referenceData.id) {
        updateReferenceFeature(olFeatureForMap);
      }
    }
  });

  return new VectorLayer({
    classname: 'ferries',
    visible: mapContext.visible_layers.inlandFerries,
    source: vectorSource,
    style: () => null
  });
}

export function updateFerriesLayer(ferries, layer, setLoadingLayers) {
  if(ferries === undefined){
    return;
  }
  const ferriesDict = ferries.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const ferryFeature of layer.getSource().getFeatures()) {
    ferryFeature.setStyle(ferriesDict[ferryFeature.getId()] ? ferryStyles['static'] : new Style(null));
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    ferries: false
  }));
}
