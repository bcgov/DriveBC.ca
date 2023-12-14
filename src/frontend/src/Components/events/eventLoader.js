// Components and functions
import { transformFeature } from '../map/helper.js';

// OpenLayers
import { Point, LineString } from 'ol/geom';
import * as ol from 'ol';

export function eventLoader(eventsData, projectionCode, layersObject) {
  eventsData.forEach(record => {
    let olGeometry = null;
    let centroidFeatureForMap = null;
    switch (record.location.type) {
      case 'Point':
        olGeometry = new Point(record.location.coordinates);
        break;
      case 'LineString':
        olGeometry = new LineString(record.location.coordinates);
        break;
      default:
        console.log(Error);
    }
    const olFeature = new ol.Feature({ geometry: olGeometry });

    // Transfer properties
    olFeature.setProperties(record);

    // Transform the projection
    const olFeatureForMap = transformFeature(
      olFeature,
      'EPSG:4326',
      projectionCode,
    );
    // if the event is a line, then create a centroid feature to attach
    if (olFeature.getGeometry().getType() === 'LineString') {
      layersObject.eventLineLayer.getSource().addFeature(olFeatureForMap);
      const centroidGeometry = new Point(
        olFeature.getGeometry().getCoordinates()[
          Math.floor(olFeature.getGeometry().getCoordinates().length / 2)
        ],
      );
      const centroidFeature = new ol.Feature({
        geometry: centroidGeometry,
      });
      // Transfer properties
      centroidFeature.setProperties(record);
      // Transform the projection
      centroidFeatureForMap = transformFeature(
        centroidFeature,
        'EPSG:4326',
        projectionCode,
      );
      centroidFeatureForMap.setId(olFeatureForMap.ol_uid);
      layersObject.eventPointLayer.getSource().addFeature(centroidFeatureForMap);
      olFeatureForMap.setId(centroidFeatureForMap.ol_uid);
    }else{
      layersObject.eventPointLayer.getSource().addFeature(olFeatureForMap);
    }
  });
}
