// React
import React, { useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark
} from '@fortawesome/pro-solid-svg-icons';

// Images
import staleLogo from '../../../images/status-stale.svg';

// Styling
import './ServerError.scss';

export default function ServerErrorPopup() {
  const [visible, setVisible] = useState(true);

  // Rendering
  return visible ? (
    <div className="server-error">
      <img src={staleLogo} alt="Server error" />
      <div className="message-container">
        <div><b>Page information not updated recently</b></div>
        <div>Check your network connection, refresh the page, or try again later.</div>
      </div>

      <div className="close-btn" aria-label="Close" onClick={(event) => {
        event.stopPropagation();
        setVisible(false);
      }}>
        <FontAwesomeIcon icon={faXmark} />
      </div>
    </div>
  ) : null;
}
