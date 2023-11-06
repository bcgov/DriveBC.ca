// React
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

// Third party packages
import Container from 'react-bootstrap/Container';
import parse from 'html-react-parser';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faMap,
  faFileLines
} from '@fortawesome/free-regular-svg-icons';

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

  const mapViewObj = new View({
    // Centered on Downtown Kelowna
    center: transform([-119.49662112970556, 49.887338062986295], 'EPSG:4326', 'EPSG:3857'),
    zoom: 14,
  });

  new Map({
    target: 'map',
    layers: [
      tileLayer,
      vectorLayer,
    ],
    view: mapViewObj,
  });

  return mapViewObj;
}

export default function AdvisoryDetailsPage() {
  // Context and router data
  const params = useParams();
  const isInitialMount = useRef(true);
  const mapView = useRef();
  const [advisory, setAdvisory] = useState(null);

  const fitMap = (data) => {
    const geom = new GeoJSON().readGeometry(data.geometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });

    mapView.current.fit(geom);
  }

  // Data function and initialization
  const loadAdvisory = async () => {
    const advisoryData = await getAdvisories(params.id);
    setAdvisory(advisoryData);

    // Run once on startup
    if (isInitialMount.current){
      mapView.current = getMap(advisoryData);
    }

    fitMap(advisoryData);

    isInitialMount.current = false;
  };

  useEffect(() => {
    loadAdvisory();
  }, []);

  // Tabs view on mobile
  const [activeTab, setActiveTab] = useState('details');
  const advisoryDetails = <FontAwesomeIcon icon={faFileLines} />;
  const advisoryMap = <FontAwesomeIcon icon={faMap} />;

  // Rendering
  return (
    <div className='advisory-page cms-page'>
      {advisory && (
        <div className="page-header">
          <Container>
            <h1 className="page-title">{advisory.title}</h1>

            {advisory.teaser &&
              <p className="page-description body--large">{advisory.teaser}</p>
            }

            <div className="timestamp-container">
              <span className="advisory-li-state">{advisory.first_published_at != advisory.last_published_at ? "Updated" : "Published" }</span>
              <FriendlyTime date={advisory.latest_revision_created_at} />
            </div>
          </Container>
        </div>
      )}

      <Tabs
        id="advisory-details"
        activeKey={activeTab}
        onSelect={ (selectedTab) => setActiveTab(selectedTab) }
      >
        <Tab eventKey="details" title={<span>{advisoryDetails}Details</span>}>
          {advisory && (
            <Container className="advisory-body-container cms-body">
              <p>{parse(advisory.body)}</p>
            </Container>
          )}
        </Tab>
        <Tab eventKey="map" title={<span>{advisoryMap}Map View</span>}>
          <Container className="advisory-map-container">
            <div id="map" className="advisory-map"></div>
          </Container>
        </Tab>
      </Tabs>

      { (activeTab === 'details') &&
        <Footer />
      }
    </div>
  );
}
