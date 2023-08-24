// React
import React, {useContext} from 'react';

// Third party packages
import {faLayerGroup, faXmark} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import Button from 'react-bootstrap/Button';

// Components and functions
import {MapContext} from '../App.js';

// Static files
import videoIcon from '../assets/video-solid.png';
import eventIcon from '../assets/exclamation-triangle-solid.png';
import map from '../assets/map.png';
import terrain from '../assets/terrain.png';

// Styling
import './Layers.scss';

export default function Layers({open, setLayersOpen, toggleLayer}) {
  const {mapContext} = useContext(MapContext);

  if (!open) {
    return (
      <Button variant="outline-primary"
        className="map-btn open-layers"
        onClick={() => setLayersOpen(true)}
      >
        <FontAwesomeIcon icon={faLayerGroup} />
      </Button>
    );
  }

  return (
    <div className="layers">
      <button className="close-layers"
        onClick={() => setLayersOpen(false)}
      ><FontAwesomeIcon icon={faXmark} /></button>

      <h4>Base Layers</h4>

      <div className="layers-select">
        <div className="panel">
          <img className='map-image' src={map} alt="Map" />
          <div>Map</div>
        </div>

        <div className="panel">
          <img className='map-image' src={terrain} alt="Terrain" />
          <div>Terrain</div>
        </div>
      </div>

      <h4>Features</h4>

      <div className="layer-item">
        <img className="map-icon" src={videoIcon} alt="Webcam Icon" />
        <input
          type="checkbox" name="webcam" id="webcam"
          onChange={(e) => toggleLayer('webcamsLayer', e.target.checked)}
          defaultChecked={mapContext.visible_layers.webcamsLayer}
        />
        <label htmlFor="webcam">Webcams</label>
      </div>

      <div className="layer-item">
        <img className="map-icon" src={eventIcon} alt="Event Icon" />
        <input type="checkbox" name="events" id="events"
          onChange={(e) => toggleLayer('eventsLayer', e.target.checked)}
          defaultChecked={mapContext.visible_layers.eventsLayer}
        />
        <label htmlFor="events">Road Events</label>
      </div>
      <div className="layer-item">
        <img className="map-icon" src={eventIcon} alt="Event Icon" />
        <input type="checkbox" name="highway" id="highways"
          onChange={(e) => toggleLayer('highwayLayer', e.target.checked)}
          defaultChecked={mapContext.visible_layers.highwayLayer}
        />
        <label htmlFor="highways">Highways</label>
      </div>
      <div className="layer-item">
        <img className="map-icon" src={eventIcon} alt="Event Icon" />
        <input type="checkbox" name="open511" id="open511"
          onChange={(e) => toggleLayer('open511Layer', e.target.checked)}
          defaultChecked={mapContext.visible_layers.open511Layer}
        />
        <label htmlFor="open511">Open511 events</label>
      </div>
    </div>
  );
}
