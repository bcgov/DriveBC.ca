import React, {useEffect, useRef, useState} from 'react';

// Third party packages
import parse from 'html-react-parser';

// Components and functions
import PageHeader from '../PageHeader';
import Footer from '../Footer.js';
import SharePanel from './SharePanel';

// // OpenLayers
// import { applyStyle } from 'ol-mapbox-style';
// import { transform } from 'ol/proj';
// import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
// import { Vector as VectorSource } from 'ol/source.js';
// import { Vector as VectorLayer } from 'ol/layer.js';
// import GeoJSON from 'ol/format/GeoJSON.js';
// import Map from 'ol/Map.js';
// import MVT from 'ol/format/MVT.js';
// import VectorTileLayer from 'ol/layer/VectorTile.js';
// import VectorTileSource from 'ol/source/VectorTile.js';
// import View from 'ol/View.js';

// Styling
import './BulletinsListPage.scss';
import './SharePanel.scss'

// Bulletins API function
function getBulletins() {
  return fetch(`//${process.env.REACT_APP_API_HOST}/api/cms/bulletins/`, {
    headers: {
      'Content-Type': 'application/json',
    },

  }).then((response) => response.json())
  .then((data) => data)
  .catch((error) => {
    console.log(error);
  });
}

export default function BulletinsListPage() {
  // Ref and state hooks
  const isInitialMount = useRef(true);
  const [Bulletins, setBulletins] = useState([]);

  // Data function and initialization
  const getData = async () => {
    const BulletinsData = await getBulletins();
    setBulletins(BulletinsData);


    isInitialMount.current = false;
  };

  useEffect(() => {
    getData();

    return () => {
      // Unmounting, set to empty list
      setBulletins([]);
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

    // Separate the timestamp and offset
    const [timestampPart, offsetPart] = timestamp.split('-');

    // Remove the colon from the offset (e.g., "-07:00" => "-0700")
    const offset = offsetPart.replace(':', '');

    // Combine the timestamp and offset
    const formattedTimestamp = timestampPart + offset;

    // Create a Date object from the formatted timestamp
    const date = new Date(formattedTimestamp);

    console.log(date); // This will give you the JavaScript Date object
    return date;
  };

  // Rendering
  return (
    <div className='bulletins-page'>
      <PageHeader
        title='Bulletins'
        description='Bulletins display from Wagtail CMS'>
      </PageHeader>
      <div className='bulletin-container'>
        <div className='bulletin-list'>
          {Bulletins.map((bul, index) => {
            return (
              <div key={bul.id} className="bul">
              <div>
                <h1>{bul.bulletin_title}</h1>
                {new Date().getTime() - timeToDateFormate(bul.modified_at) <=
                2 * 60 * 60 * 1000 ? (
                  <p>Last Updated {formatTime(new Date(bul.modified_at))}</p>
                ) : (
                  <p>
                    Last Updated at {formatUTC(new Date(bul.modified_at))}
                  </p>
                )}

                <h2>{bul.bulletin_teaser}</h2>
                
                <div>{parse(bul.bulletin_body)}</div>
              </div>
            </div>
            );
          })}
        </div>
        <SharePanel/>
      </div>
      <Footer />
    </div>
  );
}