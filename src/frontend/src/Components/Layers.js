// React
import React, { useContext } from 'react';

// Third party packages
import { faLayerGroup, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'react-bootstrap/Button';

// Components and functions
import { MapContext } from '../App.js';

// Static files
import videoIcon from '../assets/video-solid.png';
import eventIcon from '../assets/exclamation-triangle-solid.png';
import ferryIcon from '../assets/ferry-solid.png';

// Styling
import './Layers.scss';

export default function Layers({ open, setLayersOpen, toggleLayer }) {
  const { mapContext } = useContext(MapContext);

  if (!open) {
    return (
      <Button
        variant="primary"
        className="map-btn open-layers"
        onClick={() => setLayersOpen(true)}
        aria-label="open layers options">
        <FontAwesomeIcon icon={faLayerGroup} />
      </Button>
    );
  }

  return (
    <div className="layers">
      <button className="close-layers" onClick={() => setLayersOpen(false)} aria-label="close layers options">
        <FontAwesomeIcon icon={faXmark} />
      </button>
      <h4>Features</h4>

      <div className="layer-item">
        <img className="map-icon" src={videoIcon} role="presentation" />
        <input
          type="checkbox"
          name="cameras"
          id="cameras"
          aria-label="cameras"
          onChange={e => toggleLayer('webcamsLayer', e.target.checked)}
          defaultChecked={mapContext.visible_layers.webcamsLayer}
        />
        <label htmlFor="cameras">Cameras</label>
      </div>

      <div className="layer-item">
        <img className="map-icon" src={eventIcon} role="presentation" />
        <input
          type="checkbox"
          name="events"
          id="events"
          onChange={e => toggleLayer('eventsLayer', e.target.checked)}
          defaultChecked={mapContext.visible_layers.eventsLayer}
        />
        <label htmlFor="events">Road Events</label>
      </div>

      <div className="layer-item">
        <img className="map-icon" src={ferryIcon} role="presentation" />
        <input
          type="checkbox"
          name="ferries"
          id="ferries"
          onChange={e => toggleLayer('ferriesLayer', e.target.checked)}
          defaultChecked={mapContext.visible_layers.ferriesLayer}
        />
        <label htmlFor="ferries">Inland Ferries</label>
      </div>
    </div>
  );
}
