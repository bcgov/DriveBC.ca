// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { MultiPolygon } from 'ol/geom';
import { Style } from "ol/style";
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { advisoryStyles } from '../../data/featureStyleDefinitions.js';

export function getAdvisoriesLayer(
  advisories,
  projectionCode,
  mapContext,
  referenceData,
  updateReferenceFeature
) {
  return new VectorLayer({
    classname: 'advisories',
    visible: true,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        advisories.forEach(advisory => {
          // Build a new OpenLayers feature
          const olGeometry = new MultiPolygon(advisory.geometry.coordinates);
          const olFeature = new ol.Feature({ geometry: olGeometry, type: 'advisory' });

          olFeature.set('data', advisory);

          // Transform the projection
          const olFeatureForMap = transformFeature(
            olFeature,
            'EPSG:4326',
            projectionCode,
          );

          // feature ID to advisory ID for retrieval
          olFeatureForMap.setId(advisory.id);

          vectorSource.addFeature(olFeatureForMap);

          // Update the reference feature if id is the reference
          if (referenceData?.type === 'advisory') {
            // Loose comparison as types may differ (string vs number)
            if (advisory.id == referenceData.id) {
              updateReferenceFeature(olFeatureForMap);
            }
          }
        });
      },
    }),

    style: () => advisoryStyles.static,
  });
}

export function updateAdvisoriesLayer(advisories, layer, setLoadingLayers) {
  const featuresDict = {};

  const advisoriesDict = advisories ? advisories.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {}) : {};

  for (const advisoryFeature of layer.getSource().getFeatures()) {
    if(!advisoryFeature.get('clicked')){
      advisoryFeature.setStyle(advisoriesDict[advisoryFeature.getId()] ? advisoryStyles.static : new Style(null));
    }

    featuresDict[advisoryFeature.get('data').id] = advisoryFeature;
  }

  return featuresDict;
}
