import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

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
import SharePanel from './SharePanel';

// Styling
import './AdvisoriesPage.scss';
import './SharePanel.scss'

function getMap(locationGeometry, mapContainerId) {
  const image = new CircleStyle({
    radius: 5,
    fill: null,
    stroke: new Stroke({ color: 'red', width: 1 }),
  });
  const styles = {
    Point: new Style({
      image: image,
    }),
    LineString: new Style({
      stroke: new Stroke({
        color: 'green',
        width: 1,
      }),
    }),
    Polygon: new Style({
      stroke: new Stroke({
        color: 'blue',
        lineDash: [4],
        width: 3,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0.1)',
      }),
    }),
  };

  const styleFunction = function (feature) {
    return styles[feature.getGeometry().getType()];
  };
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(locationGeometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
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
    headers: { 'Content-Type': 'application/json' },
  }).then(function (response) {
    response.json().then(function (glStyle) {
      // overriding default font value so it doesn't return errors.
      glStyle.metadata['ol:webfonts'] = '';
      applyStyle(tileLayer, glStyle, 'esri');
    });
  });

  return new Map({
    target: mapContainerId, // Use the provided mapContainerId
    layers: [tileLayer, vectorLayer],
    view: new View({
      // Centered on Downtown Vancouver
      center: transform([-123.11768530084888, 49.28324595133542], 'EPSG:4326', 'EPSG:3857'),
      zoom: 14,
    }),
  });
}

function getAdvisories() {
  return fetch(`//${process.env.REACT_APP_API_HOST}/api/cms/advisories/`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      console.log(error);
    });
}

export default function AdvisoriesListPage() {
  const { id } = useParams();
  // Ref and state hooks
  const isInitialMount = useRef(true);
  const [Advisories, setAdvisories] = useState([]);

  // Data function and initialization
  const getData = async () => {
    let AdvisoriesData = await getAdvisories();
    if(id){
        AdvisoriesData = AdvisoriesData.filter(advisory => advisory.id.toString() === id);
    }
    console.log(AdvisoriesData);
    setAdvisories(AdvisoriesData);

    if (!isInitialMount.current) {
      AdvisoriesData.forEach((element, index) => {
        getMap(element.location_geometry, `map-${index}`);
      });
    }

    isInitialMount.current = false;
  };

  useEffect(() => {
    getData();

    return () => {
      // Unmounting, set to empty list
      setAdvisories([]);
    };
  }, []);

  // Function to format a date as "HH:mm" (hours and minutes)
  const formatTime = date => {
    return `${date.getHours()} hours ${date.getMinutes()} minutes ago`;
  };

  // Function to format a date as UTC time
  const formatUTC = date => {
    return date.toUTCString();
  };

  const timeToDateFormate = timestamp => {
    // const timestamp = "2023-09-05T08:30:28.843581-07:00";
    const [timestampPart, offsetPart] = timestamp.split('-');
    const offset = offsetPart.replace(':', '');
    const formattedTimestamp = timestampPart + offset;
    const date = new Date(formattedTimestamp);
    return date;
  };

  // Rendering
  return (
    <div className="advisories-page">
      <PageHeader
        title="Advisories"
        description="Advisories display from Wagtail CMS"></PageHeader>
      <div className="advisory-container">
        <div className="advisory-list">
          {Advisories.map((adv, index) => {
            const mapContainerId = `map-${index}`;
            return (
              <div key={adv.id} className="adv">
                <div>
                  <h1><a href={`/advisories-page/${adv.id}`} className='advisory-title'>{adv.advisory_title}</a></h1>
                  {new Date().getTime() - timeToDateFormate(adv.modified_at) <=
                  2 * 60 * 60 * 1000 ? (
                    <p>Last Updated {formatTime(new Date(adv.modified_at))}</p>
                  ) : (
                    <p>
                      Last Updated at {formatUTC(new Date(adv.modified_at))}
                    </p>
                  )}

                  <h2>{adv.advisory_teaser}</h2>
                  <div id={mapContainerId} className="advisory-map"></div>
                  <div>{parse(adv.advisory_body)}</div>
                </div>
                <SharePanel />
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
