// React
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

// Third party packages
import Container from 'react-bootstrap/Container';
import parse from 'html-react-parser';

// Components and functions
import { getAdvisories } from '../Components/data/advisories.js';
import Footer from '../Footer';
import FriendlyTime from '../Components/FriendlyTime';

// Styling
import './AdvisoryDetailsPage.scss';

// OpenLayers
import { applyStyle } from 'ol-mapbox-style';
import { transform } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Map from 'ol/Map.js';
import MVT from 'ol/format/MVT.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import View from 'ol/View.js';

// OpenLayers functions
function getMap(advisoryData) {
  const image = new CircleStyle({
    radius: 5,
    fill: null,
    stroke: new Stroke({color: 'red', width: 1}),
  });

  const styles = {
    'Point': new Style({
      image: image,
    }),
    'LineString': new Style({
      stroke: new Stroke({
        color: 'green',
        width: 1,
      }),
    }),
    'Polygon': new Style({
      stroke: new Stroke({
        color: 'blue',
        lineDash: [4],
        width: 3,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0.1)',
      }),
    })
  };

  const styleFunction = function (feature) {
    return styles[feature.getGeometry().getType()];
  };

  const geojsonObject = {
    'type': 'FeatureCollection',
    'crs': {
      'type': 'name',
      'properties': {
        'name': 'EPSG:3857',
      },
    },
    'features': [
      {
        'type': 'Feature',
        'geometry': advisoryData.geometry,
      }
    ]
  };

  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojsonObject, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    }),
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: styleFunction,
  });

  const tileLayer = new VectorTileLayer({
    source: new VectorTileSource({
      format: new MVT(),
      url: `${process.env.REACT_APP_BASE_MAP}`,
    }),
  });

  // Apply the basemap style from the arcgis resource
  fetch(`${process.env.REACT_APP_MAP_STYLE}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  }).then(function(response) {
    response.json().then(function(glStyle) {
      // overriding default font value so it doesn't return errors.
      glStyle.metadata['ol:webfonts'] = '';
      applyStyle(tileLayer, glStyle, 'esri');
    });
  });

  return new Map({
    target: 'map',
    layers: [
      tileLayer,
      vectorLayer,
    ],
    view: new View({
      // Centered on Downtown Kelowna
      center: transform([-119.49662112970556, 49.887338062986295], 'EPSG:4326', 'EPSG:3857'),
      zoom: 14,
    }),
  });
}

export default function AdvisoryDetailsPage() {
  // Context and router data
  const params = useParams();
  const isInitialMount = useRef(true);
  const [advisory, setAdvisory] = useState(null);

  // Data function and initialization
  const loadAdvisory = async () => {
    const advisoryData = await getAdvisories(params.id);
    setAdvisory(advisoryData);

    // Run once on startup
    if (isInitialMount.current){
      getMap(advisoryData);
    }

    isInitialMount.current = false;
  };

  useEffect(() => {
    loadAdvisory();
  }, []);

  // Rendering
  return (
    <div className='advisory-page'>
      {advisory && (
        <div>
          <div className="page-header">
            <Container>
              <h1 className="page-title">{advisory.title}</h1>

              <div className="timestamp-container">
                <h4>{advisory.live_revision > 1 ? "Published" : "Last updated" }</h4>
                <FriendlyTime date={advisory.latest_revision_created_at} />
              </div>
            </Container>
          </div>

          <Container>
            <p>{parse(advisory.body)}</p>
          </Container>
        </div>
      )}

      <Container>
        <div id="map" className="advisory-map"></div>
      </Container>

      <Footer />
    </div>
  );
}
