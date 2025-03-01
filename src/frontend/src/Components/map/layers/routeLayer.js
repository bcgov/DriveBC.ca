// Components and functions
import { transformFeature } from '../helpers';

// OpenLayers
import { LineString } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { routeStyles } from "../../data/featureStyleDefinitions";

export function getRouteLayer(routeData, projectionCode, mapContext, selectedRoute, updateReferenceFeature, setLoadingLayers, preview=false) {
  return new VectorLayer({
    classname: 'route',
    visible: true,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();

        const getRouteFeature = (routeData) => {
          const olGeometry = new LineString(Array.isArray(routeData.route) ? routeData.route : routeData.route.coordinates[0]);
          const olFeature = new ol.Feature({ geometry: olGeometry, type: 'route' });

          // Transfer properties
          olFeature.setProperties(routeData);

          // Transform the projection
          const olFeatureForMap = transformFeature(
            olFeature,
            'EPSG:4326',
            projectionCode,
          );

          return olFeatureForMap;
        }

        routeData.forEach(function (route, i) {
          const feature = getRouteFeature(route);

          if (!preview &&  // set first route if there's no feature specified in the URL
            ((!selectedRoute && i === 0) ||
            // set target route if specified in URL
            (selectedRoute.distance === feature.getProperties().distance))
          ) {
            updateReferenceFeature(feature);
          }

          vectorSource.addFeature(feature);
        });
      },
    }),
    style: preview ? routeStyles['active'] : routeStyles['static']
  });
}
