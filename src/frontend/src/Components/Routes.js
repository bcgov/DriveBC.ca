import React, { useRef } from 'react';

import Pin from './Pin.js';

import './Routes.scss';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationArrow, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';


export default function Routes({ open, routeHandler, setRoutesOpen, setStartToLocation }) {

  const inputRef = useRef(null)

  if (!open) {
    return (
      <Button variant="outline-primary"
        className="map-btn open-routes"
        onClick={() => setRoutesOpen(true)}
      ><FontAwesomeIcon icon={faPlus} /> Add Route</Button>
    )
  }

  return (
    <div className="routes">
      <button className="close-routes"
        onClick={() => setRoutesOpen(false)}
      ><FontAwesomeIcon icon={faXmark} /></button>

      <div className="starting">
        <div className="anchor anchor-a">A</div>

        <div className="text">
          <div className="panel-text-group">
            <h4>Starting Location</h4>
            <p>Drag and drop a pin or use your current location.</p>
          </div>
          <div className="options">
            <div className="option">
              <div><Pin role="start" /></div>
              <div className="option-label">Drag and drop</div>
            </div>
            <div className="option" onClick={setStartToLocation}>
              <div className="current-location-icon">
                <FontAwesomeIcon icon={faLocationArrow} />
              </div>
              <div className="option-label">Use my location</div>
            </div>
          </div>
        </div>
      </div>
      <div className="starting">
        <div className="anchor anchor-b">B</div>

        <div className="text">
          <div className="panel-text-group">
            <h4>Destination</h4>
            <p>Drag and drop a destination pin.</p>
          </div>

          <div className="options">
            <div className="option">
              <div><Pin role="end" /></div>
              <div className="option-label">Drag and drop</div>
            </div>
          </div>
        </div>

      </div>
      <div className="notification">
        <div className="panel-text-group">
          <h4>Notification Email</h4>
          <p>Notify me of any new road events along this route.</p>
        </div>

        <div>
          <input className="form-route text_input" type="text" ref={inputRef} placeholder="Email address"/>
        </div>

        <Button variant="primary"
          className="get-route"
          onClick={() => routeHandler(inputRef.current.value)}
        ><FontAwesomeIcon icon={faPlus} /> Add Route</Button>
      </div>

    </div>
  )
};
