// Components and functions
import { getEventIcon, transformFeature } from '../helper.js';

// OpenLayers
import { Point, LineString } from 'ol/geom';
import * as ol from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export function getEventsLayer(
  eventsData,
  projectionCode,
  mapContext,
  passedEvent,
  updateClickedEvent,
) {
  return new VectorLayer({
    classname: 'events',
    visible: mapContext.visible_layers.eventsLayer,
    source: new VectorSource({
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
        const vectorSource = this;
        vectorSource.clear();
        if (eventsData) {
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

            if (olFeature.getGeometry().getType() === 'LineString') {
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
              centroidFeature.setProperties(record);
              // Transform the projection
              centroidFeatureForMap = transformFeature(
                centroidFeature,
                'EPSG:4326',
                projectionCode,
              );
              centroidFeatureForMap.setId(olFeatureForMap.ol_uid);
              vectorSource.addFeature(centroidFeatureForMap);
              olFeatureForMap.setId(centroidFeatureForMap.ol_uid);
            }

            vectorSource.addFeature(olFeatureForMap);

            if (
              passedEvent &&
              passedEvent.id === olFeatureForMap.getProperties().id
            ) {
              olFeatureForMap.setProperties({ clicked: true }, true);
              updateClickedEvent(olFeatureForMap);
            }
          });
        }
      },
    }),
    style: function (feature, resolution) {
      if (passedEvent && passedEvent.id === feature.getProperties().id) {
        return getEventIcon(feature, 'active');
      }
      return getEventIcon(feature, 'static');
    },
  });
}
