// OpenLayers
import { Point } from 'ol/geom';
import {Style, Fill, Text, Icon} from 'ol/style';
import * as ol from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster.js';
import { containsCoordinate } from 'ol/extent';
import { transform } from 'ol/proj';
// import CircleStyle from 'ol/style/Circle.js';

// Styling
import { cameraStyles, cameraGroupedStyles, unreadCameraStyles, unreadCameraGroupedStyles } from '../../data/featureStyleDefinitions';

export function getCamerasLayer(cameras, projectionCode, mapContext, referenceData, updateReferenceFeature, setLoadingLayers, pixelDistance, map) {
  const vectorSource = new VectorSource();
  const featureById = new Map();
  let cameraData = cameras;

  const clusterSource = new Cluster({
    distance: pixelDistance,
    source: vectorSource,
  });

  const styleCache = {};

  const layer = new VectorLayer({
    classname: 'webcams',
    visible: mapContext.visible_layers.highwayCams,
    source: clusterSource,

    style: function (feature) {
      const features = feature.get('features');
      const size = features.length;

      // single camera
      if (size === 1) {
        const cam = features[0];
        if (cam.get('clicked') && !cam.get('unread'))  return cameraStyles.active;
        if (cam.get('hovered') && !cam.get('unread')) return cameraStyles.hover;
        if (cam.get('clicked') && cam.get('unread')) return unreadCameraStyles.active;
        if (cam.get('hovered') && cam.get('unread')) return unreadCameraStyles.hover;

        return cam.get('unread') ? unreadCameraStyles.static : cameraStyles.static;
      }

      // Highlight group if any member is clicked/hovered; show update pip if any is unread
      let state = 'static';
      if (features.some((cam) => cam.get('clicked'))) {
        state = 'active';
      } else if (features.some((cam) => cam.get('hovered'))) {
        state = 'hover';
      }

      const hasUnread = features.some((cam) => cam.get('unread'));
      const groupedStyles = hasUnread ? unreadCameraGroupedStyles : cameraGroupedStyles;
      const cacheKey = `${state}_${size}_${hasUnread}`;
      let style = styleCache[cacheKey];

      if (!style) {
        const textColor = state === 'static' ? '#255A90' : '#fff';

        style = new Style({
          image: new Icon({
            scale: 0.25,
            src: groupedStyles[state].getImage().getSrc(),
          }),
          text: new Text({
            text: String(size),
            font: 'bold 12px BC Sans',
            fill: new Fill({ color: textColor }),
            textAlign: 'center',
            textBaseline: 'middle',
            // Keep multi-digit counts clear of the camera icon (DBC22-7186)
            offsetX: 8,
            offsetY: 1,
          }),
        });
        styleCache[cacheKey] = style;
      }

      return style;
    },
  });

  layer.getClusterSource = () => clusterSource;

  const syncViewport = () => {
    if (!map?.getSize()) return;

    const extent = map.getView().calculateExtent(map.getSize());
    const w = extent[2] - extent[0];
    const h = extent[3] - extent[1];
    // 20% pad so edge clusters don't pop in/out while panning
    const buffered = [extent[0] - w * 0.2, extent[1] - h * 0.2, extent[2] + w * 0.2, extent[3] + h * 0.2];
    const needed = new Set();

    cameraData.forEach(camera => {
      const coord = transform(camera.location.coordinates, 'EPSG:4326', projectionCode);
      const isRef = referenceData?.type === 'camera' && (
        camera.id == referenceData.id ||
        camera.camGroup?.some(cam => cam.id == referenceData.id)
      );
      if (!isRef && !containsCoordinate(buffered, coord)) return;

      needed.add(camera.id);

      if (!featureById.has(camera.id)) {
        const olGeometry = new Point(camera.location.coordinates);
        olGeometry.transform('EPSG:4326', projectionCode);

        const feature = new ol.Feature({ geometry: olGeometry, type: 'camera' });
        feature.setProperties(camera);
        feature.setId(camera.id);

        // special function for setting the feature's style, to centralize where
        // style is differentiated based on the 'unread' property
        feature.setCameraStyle = function (key) {
          if (this.get('unread')) {
            this.setStyle(unreadCameraStyles[key])
          } else {
            this.setStyle(cameraStyles[key]);
          }
        }

        featureById.set(camera.id, feature);

        // Update the reference feature if one of the cameras is the reference
        if (referenceData?.type === 'camera') {
          feature.get('camGroup').forEach((cam) => {
            if (cam.id == referenceData.id) {  // Intentional loose equality for string IDs
              if (referenceData.focusCamera) {
                feature.set('focusCamera', referenceData.focusCamera);
                feature.set('zoom', referenceData.zoom);
                feature.set('pan', referenceData.pan);
              }

              updateReferenceFeature(feature);
            }
          });
        }
      }
    });

    vectorSource.getFeatures().forEach(feature => {
      if (!needed.has(feature.getId())) vectorSource.removeFeature(feature);
    });
    needed.forEach(id => {
      if (!vectorSource.getFeatureById(id)) vectorSource.addFeature(featureById.get(id));
    });
  };

  layer.set('syncViewport', syncViewport);
  layer.set('setCameras', (next) => { cameraData = next; });
  syncViewport();

  return layer;
}

export function updateCamerasLayer(cameras, layer, setLoadingLayers) {
  const camerasLookup = cameras.reduce((dict, obj) => {
    dict[obj.id] = obj;
    return dict;
  }, {});

  layer.get('setCameras')?.(cameras);
  layer.get('syncViewport')?.();

  // Get correct ungrouped source for list of cam features
  const clusterSource = layer.getClusterSource ? layer.getClusterSource() : layer.getSource();
  const vectorSource = clusterSource.getSource ? clusterSource.getSource() : clusterSource;

  for (const feature of vectorSource.getFeatures()) {
    const camera = camerasLookup[feature.getId()];

    if (!camera) {  // camera no longer in list from API
      feature.setStyle(new Style(null));
      continue;
    }

    if (feature.get('last_update_modified') !== camera.last_update_modified) {
      feature.set('unread', true);
    }

    feature.setProperties(camera); // update feature with latest API data.

    if (feature.get('clicked')) { continue; }
    if (feature.get('type') == 'camera') {
      feature.setCameraStyle('static');
    }
  }

  setLoadingLayers(prevState => ({
    ...prevState,
    cameras: false
  }));
}
