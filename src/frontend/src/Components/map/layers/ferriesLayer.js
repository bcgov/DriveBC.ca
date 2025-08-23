// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import { Style } from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { coastalFerryStyles, ferryStyles } from '../../data/featureStyleDefinitions.js';

export function getFerriesLayer(ferriesData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  const vectorSource = new VectorSource();

  ferriesData.forEach(ferry => {
    if (ferry.routes && ferry.routes.length === 0) {
      // Skip coastal ferries without routes
      return;
    }

    const isCoastal = !!ferry.routes;

    // Offset inland ferries ~500m East to prevent overlapping with other features
    const lat = isCoastal ? ferry.location.coordinates[0] : ferry.location.coordinates[0] + 0.0044;
    const lng = ferry.location.coordinates[1]
    const olGeometry = new Point([lat, lng]);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'ferry', coastal: isCoastal });

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
      if (ferry.id == referenceData.id) {  // Intentional loose equality for string IDs
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
  const featuresDict = {};

  const ferriesDict = ferries.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const ferryFeature of layer.getSource().getFeatures()) {
    if (!ferryFeature.get('clicked')) {
      const styles = ferryFeature.get('coastal') ? coastalFerryStyles : ferryStyles;
      ferryFeature.setStyle(ferriesDict[ferryFeature.getId()] ? styles['static'] : new Style(null));
    }

    featuresDict[ferryFeature.get('id')] = ferryFeature;
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    ferries: false
  }));

  return featuresDict;
}
