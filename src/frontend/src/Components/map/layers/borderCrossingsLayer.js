// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style } from 'ol/style';

// Styling
import { borderCrossingStyles } from '../../data/featureStyleDefinitions.js';

export function getBorderCrossingsLayer(
  borderCrossings,
  projectionCode,
  mapContext,
  referenceData, updateReferenceFeature,
) {

  const vectorSource = new VectorSource();
  borderCrossings.forEach(borderCrossing => {
    // Build a new OpenLayers feature
    const olGeometry = new Point(borderCrossing.location.coordinates);
    const olFeature = new ol.Feature({ geometry: olGeometry, type: 'borderCrossing' });

    // Transfer properties
    olFeature.setProperties(borderCrossing);

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );

    // feature ID to advisory ID for retrieval
    olFeatureForMap.setId(borderCrossing.id);

    vectorSource.addFeature(olFeatureForMap);
    if (referenceData?.type === 'borderCrossing') {
      // Update the reference feature if id is the reference
      if (borderCrossing.id == referenceData.id) {  // Intentional loose equality for string IDs
        updateReferenceFeature(olFeatureForMap);
      }
    }
  });

  return new VectorLayer({
    classname: 'borderCrossings',
    visible: true,
    source: vectorSource,
    style: () => null
  });
}

export function updateBorderCrossingsLayer(borderCrossings, layer, setLoadingLayers) {
  const borderCrossingsDict = borderCrossings.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  for (const borderCrossingsFeature of layer.getSource().getFeatures()) {
    if(!borderCrossingsFeature.getProperties()['clicked']){
      borderCrossingsFeature.setStyle(borderCrossingsDict[borderCrossingsFeature.getId()] ? borderCrossingStyles['static'] : new Style(null));
    }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    cameras: false
  }));
}
