// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { restStopTruckStyles, restStopTruckClosedStyles } from '../../data/featureStyleDefinitions.js';
import { isRestStopClosed } from '../../data/restStops.js';

export function getLargeRestStopsLayer(restStopsData, projectionCode, mapContext) {
  return new VectorLayer({
    classname: 'largeRestStops',
    visible: mapContext.visible_layers.largeRestStops,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        for (const restStop of restStopsData) {
          const isLargeVehiclesAccommodated = restStop.properties.ACCOM_COMMERCIAL_TRUCKS === 'Yes'? true: false;

          if(!isLargeVehiclesAccommodated){
            continue;
          }

          // Build a new OpenLayers feature
          const olGeometry = new Point(restStop.location.coordinates);
          const olFeature = new ol.Feature({ geometry: olGeometry, type: 'restStop' });

          // Transfer properties
          olFeature.setProperties(restStop);

          // Transform the projection
          const olFeatureForMap = transformFeature(
            olFeature,
            'EPSG:4326',
            projectionCode,
          );
          let style = undefined;
          const isClosed = isRestStopClosed(restStop.properties);
          if(isClosed){
            style = restStopTruckClosedStyles['static'];
          }
          else{
            style = restStopTruckStyles['static'];
          }
          olFeatureForMap.setStyle(style);
          vectorSource.addFeature(olFeatureForMap);
        }
      },
    }),
  });
}
