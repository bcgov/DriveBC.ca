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
  faFileLines,
  faEnvelope
} from '@fortawesome/free-regular-svg-icons';
import {
  faXTwitter,
  faInstagram,
  faLinkedin,
} from '@fortawesome/free-brands-svg-icons';

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
        <Container className="social-share-container">
          <div className="social-share-div">
            <p className="bold hero">Share this page</p>
            <div className="social-share">
              <a href="https://twitter.com/DriveBC" className="footer-link" target="_blank" rel="noreferrer"  alt="Twitter">
                <FontAwesomeIcon icon={faXTwitter} />
              </a>
              <a href="https://www.instagram.com/ministryoftranbc/" className="footer-link" target="_blank" rel="noreferrer"  alt="Instagram">
                <FontAwesomeIcon icon={faInstagram}/>
              </a>
              <a href="https://www.linkedin.com/company/british-columbia-ministry-of-transportation-and-infrastructure/" className="footer-link" target="_blank" rel="noreferrer" alt="Linkedin" >
                <FontAwesomeIcon icon={faLinkedin}/>
              </a>
              <a href="" className="footer-link" target="_blank" rel="noreferrer" alt="Email" >
                <FontAwesomeIcon icon={faEnvelope}/>
              </a>
            </div>
          </div>
        </Container>
      }

      { (activeTab === 'details') &&
        <Footer />
      }
    </div>
  );
}
