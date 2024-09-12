// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { Point } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// Styling
import { restStopStyles, restStopClosedStyles, restStopTruckStyles, restStopTruckClosedStyles } from '../../data/featureStyleDefinitions.js';
import { isRestStopClosed } from '../../data/restStops.js';

export function getRestStopsLayer(restStopsData, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers) {
  return new VectorLayer({
    classname: 'restStops',
    visible: mapContext.visible_layers.restStops,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

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

          if (referenceData?.type === 'restStop' || referenceData?.type === 'largeRestStop') {
            // Update the reference feature if id is the reference
            if (restStop.id == referenceData.id) {
              updateReferenceFeature(olFeatureForMap);
            }
          }
        });

        setLoadingLayers(prevState => ({
          ...prevState,
          restStops: false
        }));
      },
    }),
  });
}
