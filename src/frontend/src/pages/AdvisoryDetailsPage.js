// React
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMap,
  faMemoCircleInfo
} from '@fortawesome/pro-regular-svg-icons';
import {
  faArrowLeft
} from '@fortawesome/pro-solid-svg-icons';
import Container from 'react-bootstrap/Container';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Skeleton from 'react-loading-skeleton';

// Internal imports
import { CMSContext } from '../App';
import { getAdvisories, markAdvisoriesAsRead } from '../Components/data/advisories.js';
import { NetworkError, NotFoundError, ServerError } from '../Components/data/helper';
import NetworkErrorPopup from '../Components//map/errors/NetworkError';
import ServerErrorPopup from '../Components//map/errors/ServerError';
import Footer from '../Footer';
import FriendlyTime from '../Components/shared/FriendlyTime';
import renderWagtailBody from '../Components/shared/renderWagtailBody.js';
import overrides from '../Components/map/overrides.js';
import ShareURLButton from '../Components/shared/ShareURLButton';

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


const NOT_FOUND_CONTENT = {
  title: 'Advisory Not Found',
  teaser: 'There is currently no published advisory at this URL',
  body: '',
};


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
    'MultiPolygon': new Style({
      stroke: new Stroke({
        color: 'rgb(255, 90, 0)',
        width: 2,
      }),
      fill: new Fill({
        color: 'rgba(255, 217, 105, 0.4)',
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
      url: window.BASE_MAP,
    }),
  });

  // Apply the basemap style from the arcgis resource
  fetch(window.MAP_STYLE, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  }).then(function(response) {
    response.json().then(function(glStyle) {
      // DBC22-2153
      glStyle.metadata['ol:webfonts'] = '/fonts/{font-family}/{fontweight}{-fontstyle}.css';

      for (const layer of glStyle.layers) {
        overrides.merge(layer, overrides[layer.id] || {});
      }

      applyStyle(tileLayer, glStyle, 'esri');
    });
  });

  const mapViewObj = new View({
    // Centered on Downtown Kelowna
    center: transform([-119.49662112970556, 49.887338062986295], 'EPSG:4326', 'EPSG:3857'),
    zoom: 14,
  });

  return new Map({
    target: 'map',
    layers: [
      tileLayer,
      vectorLayer,
    ],
    view: mapViewObj,
  });
}

export default function AdvisoryDetailsPage() {
  // Context and router data
  const params = useParams();
  const navigate = useNavigate();

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  // Refs
  const mapRef = useRef();

  // UseState hooks
  const [activeTab, setActiveTab] = useState('details');
  const [advisory, setAdvisory] = useState(null);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // Navigating to
  const returnHandler = () => {
    navigate(-1);
  };

  // Error handling
  const displayError = (error) => {
    if (error instanceof ServerError) {
      setShowServerError(true);

    } else if (error instanceof NetworkError) {
      setShowNetworkError(true);
    }
  }

  // Map functions
  const fitMap = (data) => {
    const geom = new GeoJSON().readGeometry(data.geometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });

    mapRef.current.getView().fit(geom);
  }

  // Data function and initialization
  const loadAdvisory = async () => {
    const advisoryData = await getAdvisories(params.id).catch((error) => {
      if (error instanceof NotFoundError) {
        return NOT_FOUND_CONTENT;
      } else {
        displayError(error)
      }
    });
    setAdvisory(advisoryData);

    if (advisoryData.id) {
      if (!mapRef.current) {
        mapRef.current = getMap(advisoryData);
      }

      fitMap(advisoryData);

      document.title = `DriveBC - Advisories - ${advisoryData.title}`;

      markAdvisoriesAsRead([advisoryData], cmsContext, setCMSContext);
    }

    setShowLoader(false);
  };

  useEffect(() => {
    loadAdvisory();
  }, []);

  useEffect(() => {
    if (activeTab === 'map') {
      setTimeout(() => {
        fitMap(advisory);
      }, 100);
    }
  }, [activeTab]);

  // Tabs view on mobile
  const advisoryDetails = <FontAwesomeIcon icon={faMemoCircleInfo} />;
  const advisoryMap = <FontAwesomeIcon icon={faMap} />;


  let content = advisory;
  if (content && params.subid) {
    content = advisory.subpages.filter((sub) => sub.slug === params.subid)[0];
  }

  // Rendering
  return (
    <div className='advisory-page cms-page'>
      {showNetworkError &&
        <NetworkErrorPopup />
      }

      {!showNetworkError && showServerError &&
        <ServerErrorPopup setShowServerError={setShowServerError} />
      }

        <div className="page-header">
          <Container id="back-container">
            <a
              className="back-link"
              onClick={returnHandler}
              onKeyDown={keyEvent => {
                if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                  returnHandler();
                }
              }}
              tabIndex={0}>
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to last page
            </a>
          </Container>
        </div>

        <Container className="page-header__title">
          {content && !showLoader &&
            <React.Fragment>
              <h1 className="page-title">{content.title}</h1>
              {content.teaser &&
                <p className="page-description body--large">{content.teaser}</p>
              }

              {content.first_published_at &&
                <div className="page-header__title__meta">
                  <div className="timestamp-container">
                    <span>{content.first_published_at != content.last_published_at ? "Updated" : "Published" }</span>
                    <FriendlyTime date={content.latest_revision_created_at} />
                  </div>
                  <ShareURLButton />
                </div>
                }
            </React.Fragment>
          }

          {showLoader &&
            <div>
              <br/><Skeleton width={280} height={36}/>
              <br/><Skeleton width={320} height={24}/>
              <br/><Skeleton width={240} height={18}/>
            </div>
          }
        </Container>

      <Tabs
        id="advisory-details"
        activeKey={activeTab}
        onSelect={(selectedTab) => setActiveTab(selectedTab) }>

        <Tab eventKey="details" title={<span>{advisoryDetails}Details</span>}>
          <Container className="advisory-body-container cms-body">
            {showLoader &&
              <Skeleton width={320} height={40} />
            }

            {content && !showLoader &&
              <div>{renderWagtailBody(content.body)}</div>
            }
          </Container>
        </Tab>

        <Tab eventKey="map" className={params.subid ? 'hide': ''} title={<span>{advisoryMap}Map View</span>}>
          <Container className="advisory-map-container">
            {showLoader && <Skeleton height={300}/>}

            <div id="map" className={'advisory-map' + (showLoader ? ' hidden' : '')}></div>
          </Container>
        </Tab>
      </Tabs>

      {(activeTab === 'details') &&
        <Footer />
      }
    </div>
  );
}
