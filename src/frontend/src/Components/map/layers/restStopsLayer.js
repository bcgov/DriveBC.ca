// Components and functions
import { transformFeature } from '../helper.js';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OpenSeason from '../../OpenSeason.js';

// Styling
import { restStopStyles, restStopClosedStyles, restStopTruckStyles, restStopTruckClosedStyles } from '../../data/featureStyleDefinitions.js';
import { isRestStopClosed } from '../../data/restStops.js';

export function getRestStopsLayer(restStopsData, projectionCode, mapContext) {
  return new VectorLayer({
    classname: 'restStops',
    visible: mapContext.visible_layers.restStops,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        restStopsData.forEach(restStop => {
          // Build a new OpenLayers feature
          const olGeometry = new Point(restStop.location.coordinates);
          const olFeature = new ol.Feature({ geometry: olGeometry });

          // Transfer properties
          olFeature.setProperties(restStop);
          olFeature.set('type', 'rest');

          // Transform the projection
          const olFeatureForMap = transformFeature(
            olFeature,
            'EPSG:4326',
            projectionCode,
          );

          let style = undefined;
          const isClosed = isRestStopClosed(restStop.properties);
          const isLargeVehiclesAccommodated = restStop.properties.ACCOM_COMMERCIAL_TRUCKS === 'Yes'? true: false;
          if(isClosed){
            if(isLargeVehiclesAccommodated){
              style = restStopTruckClosedStyles['static'];

            }
            else{
              style = restStopClosedStyles['static'];
            }
          }
          else{
            if(isLargeVehiclesAccommodated){
              style = restStopTruckStyles['static'];
            }
            else{
              style = restStopStyles['static'];
            }
          } 

          olFeatureForMap.setStyle(style);

          vectorSource.addFeature(olFeatureForMap);
        });
      },
    }),
  });
}
