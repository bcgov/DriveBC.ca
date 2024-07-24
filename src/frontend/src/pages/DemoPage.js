/* eslint-disable no-unused-vars, prefer-const */
import React, {
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { memoize } from 'proxy-memoize';
import { applyStyle } from 'ol-mapbox-style';
import Map from 'ol/Map';
import Geolocation from 'ol/Geolocation.js';
import MVT from 'ol/format/MVT.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import * as turf from '@turf/turf';

import RouteSearch from '../Components/routing/RouteSearch.js';
import { getRouteLayer } from '../Components/map/layers/routeLayer.js';

import { fitMap } from '../Components/map/helpers';

import './DemoPage.scss';


export default function DemoPage() {

  const {
    routes: { searchLocationFrom, searchLocationTo, selectedRoute },
  } = useSelector(
    useCallback(
      memoize(state => ({
        routes: state.routes,
      })),
    ),
  );

  const mapElement = useRef();
  const mapLayers = useRef({});
  const mapRef = useRef();
  const mapView = useRef();
  const thumbnail = useRef();

  const [referenceFeature, updateReferenceFeature] = useState();

  useEffect(() => {
    if (mapRef.current) return; // stops map from initializing more than once

    // base tile map layer
    const vectorLayer = new VectorTileLayer({
      declutter: true,
      source: new VectorTileSource({
        format: new MVT(),
        url: window.BASE_MAP,
      }),
    });

    // initialize starting optional mapLayers
    mapLayers.current = {
      tid: Date.now(),
      route: null,
    };

    // Set map extent (W, S, E, N)
    const extent = [-143.230138, 46.180153, -109.977437, 65.591323];
    const transformedExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

    mapView.current = new View({
      projection: 'EPSG:3857',
      constrainResolution: true,
      center: fromLonLat([-119, 50]),
      zoom: 7,
      maxZoom: 15,
      extent: transformedExtent,
      enableRotation: false
    });
    window.view = mapView.current;
    window.mapRef = mapRef.current;

    // Apply the basemap style from the arcgis resource
    fetch(window.MAP_STYLE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(function (response) {
      response.json().then(function (glStyle) {
        // DBC22-2153
        glStyle.metadata['ol:webfonts'] = '/fonts/{font-family}/{fontweight}{-fontstyle}.css';

        applyStyle(vectorLayer, glStyle, 'esri');
      });
    });

    // create map
    mapRef.current = new Map({
      target: mapElement.current,
      layers: [vectorLayer],
      view: mapView.current,
      // pixelRatio: 1.5,
      moveTolerance: 7,
      controls: [],
    });
    window.mapRef = mapRef;
    window.el = mapElement;

  });

  useEffect(() => {
    // Remove layer if no route found
    const dl = selectedRoute && selectedRoute.routeFound ? selectedRoute : null;
    if (mapLayers.current['route']) {
      mapRef.current.removeLayer(mapLayers.current['route']);
    }
    if (!dl) {
      thumbnail.current.removeAttribute('src');
      return;
    }

    mapLayers.current['route'] = getRouteLayer(
      dl, mapRef.current.getView().getProjection().getCode(), 3, null, updateReferenceFeature
    );
    mapRef.current.addLayer(mapLayers.current['route']);

    // fit map to route
    const routeBbox = turf.bbox(turf.lineString(selectedRoute.route));
    const routeExtent = transformExtent(routeBbox, 'EPSG:4326', 'EPSG:3857');
    if (mapView.current) {
      mapView.current.fit(routeExtent);
    }

    mapRef.current.once('rendercomplete', function() {
      /* This function works by taking the canvas for the map displaying the
       * route, creating a new canvas, and copying the image from the map
       * canvas to the new canvas.  This has the important effect of converting
       * the map canvas's image to a fixed size canvas that will be standard
       * for all thumbnails.  The map canvas is sized by CSS but rendered at the
       * CSS size * the devicePixelRatio (e.g., a 400x200 map is rendered at
       * 600x300 on a screen with a DPR of 1.5).
       *
       * If we don't do this, the thumbnail is sized by the device the user is
       * saving the route on.  This can have significant impact on the size of
       * the data URL generated on, say, an iPhone with a DPR of 2, quadrupling
       * the image size.
       *
       * After copying the image, we can retrieve the data URL from it.
       */
      const canvas = mapElement.current.querySelector('canvas');
      if (!canvas) { return; }
      const image = document.createElement('canvas');
      image.width = 400;
      image.height = 200;
      const context = image.getContext('2d', { alpha: 1 });
      const matrix = [
        image.width / canvas.width, 0, 0,
        image.height / canvas.height, 0, 0
      ];
      context.imageSmoothingQuality = "high";
      context.fillStyle = "white";
      context.fillRect(0, 0, image.width, image.height);
      context.setTransform(... matrix);
      context.drawImage(canvas, 0, 0);
      context.setTransform(1, 0, 0, 1, 0, 0);

      thumbnail.current.src = image.toDataURL();
    });
  }, [selectedRoute]);

  return (
    <div className="demo">
      <h2 className='container'>Demo Route Saving</h2>
      <div className='container'>
        <RouteSearch routeEdit={true} />
      </div>
      <div className='container maps'>
        <div ref={mapElement} className='demo-map'></div>
        <div className="thumbnail"><img ref={thumbnail} height="200" width="400" /></div>
      </div>
    </div>
  )
}