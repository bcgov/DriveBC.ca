// React
import React, {useEffect, useRef, useState} from 'react';

// Third party packages
import parse from 'html-react-parser';

// Components and functions
import PageHeader from '../PageHeader';
import Footer from '../Footer.js';

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

// Styling
import './FAQsPage.scss';

// OpenLayers functions
function getMap(FAQsData) {
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
    'features': FAQsData.map((faq, index) => {
      return (
        {
          'type': 'Feature',
          'geometry': faq.location_geometry,
        }
      );
    })
  }

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
      // Centered on Downtown Vancouver
      center: transform([-123.11768530084888, 49.28324595133542], 'EPSG:4326', 'EPSG:3857'),
      zoom: 14,
    }),
  });
}

// FAQ API function
function getFAQs() {
  return fetch(`//${process.env.REACT_APP_API_HOST}/api/cms/faqs/`, {
    headers: {
      'Content-Type': 'application/json',
    },

  }).then((response) => response.json())
  .then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}

export default function FAQsPage() {
  // Ref and state hooks
  const isInitialMount = useRef(true);
  const [FAQs, setFAQs] = useState([]);

  // Data function and initialization
  const getData = async () => {
    const FAQsData = await getFAQs();
    setFAQs(FAQsData);

    if (!isInitialMount.current){
      getMap(FAQsData);
    }

    isInitialMount.current = false;
  };

  useEffect(() => {
    getData();

    return () => {
      // Unmounting, set to empty list
      setFAQs([]);
    };
  }, []);

  // Rendering
  return (
    <div className='faqs-page'>
      <PageHeader
        title='FAQs'
        description='FAQs display from Wagtail CMS'>
      </PageHeader>
      <div className='faq-container'>
        <div className='faq-list'>
          {FAQs.map((faq, index) => {
            return (
              <div key={faq.id} className='faq'>
                <div>
                  <h1>{faq.name}</h1>
                  <div>
                    {parse(faq.body)}
                  </div>
                </div>

                <img className='image' src={faq.url}/>
              </div>
            );
          })}
        </div>

        <div id="map" className="faq-map"></div>
      </div>
      <Footer />
    </div>
  );
}
