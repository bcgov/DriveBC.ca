import React, { useEffect, useState } from 'react';

import './Advisory.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faXmark  } from '@fortawesome/free-solid-svg-icons';

export default function Advisory({ advisories }) {
  const [open, setOpen] = useState(false);

  function togglePanel(openPanel) {
    setOpen(openPanel);
  }

  if(open) {
    return (
      <div className="travel-advisory-panel-full">
        <div className="travel-advisory-panel-full-body">
        <button className="travel-advisory-close" onClick={() => togglePanel(false)}>
          <FontAwesomeIcon icon={faXmark} />
        </button></div>
        <div className="travel-advisory-panel-content">
          {advisories.map((item, index) => {
            return <div className="travel-advisory-item" key={item.id}>
              <div className="travel-advisory-header">
              <h4>
                <FontAwesomeIcon icon={faTriangleExclamation} />
                  Travel Advisory
                </h4>
                  <span className="travel-advisory-header-count">{index + 1} of {advisories.length}</span>
              </div>
              <div className="travel-advisory-title">{item.title}</div>
              <div className="travel-advisory-desc">{item.text}</div>
            </div>
          })}
        </div>
      </div>
    )
  } else {
    return (
      <div className="travel-advisory-panel" onClick={() => togglePanel(true)}>
      <FontAwesomeIcon icon={faTriangleExclamation} />Travel Advisory <span className="travel-advisory-panel-count">({advisories.length})</span>
      </div>
    )
  }

};
