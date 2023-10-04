// Components and functions
import { transformFeature } from './helper.js';

// OpenLayers
import { Point, LineString } from 'ol/geom';
import { Stroke, Style } from 'ol/style.js';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export function getRouteLayer(routeData, projectionCode) {
  return new VectorLayer({
    classname: 'route',
    visible: true,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        let olGeometry = null;
        let centroidFeatureForMap = null;

        olGeometry = new LineString(routeData.route);
        const olFeature = new ol.Feature({ geometry: olGeometry });

        // Transfer properties
        olFeature.setProperties(routeData);

        // Transform the projection
        const olFeatureForMap = transformFeature(
          olFeature,
          'EPSG:4326',
          projectionCode,
        );

        const centroidGeometry = new Point(
          olFeature.getGeometry().getCoordinates()[
            Math.floor(
              olFeature.getGeometry().getCoordinates().length / 2,
            )
          ],
        );

        const centroidFeature = new ol.Feature({
          geometry: centroidGeometry,
        });

        // Transfer properties
        centroidFeature.setProperties(routeData);

        // Transform the projection
        centroidFeatureForMap = transformFeature(
          centroidFeature,
          'EPSG:4326',
          projectionCode,
        );

        centroidFeatureForMap.setId(olFeatureForMap.ol_uid);
        vectorSource.addFeature(centroidFeatureForMap);
        olFeatureForMap.setId(centroidFeatureForMap.ol_uid);

        vectorSource.addFeature(olFeatureForMap);
      },
    }),
    style: new Style({
      stroke: new Stroke({
        color: 'rgba(216 ,41 ,47, 0.9)',
        width: 10,
      })
    })
  });
}
