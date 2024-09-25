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
import './StaleLinkError.scss';

export default function StaleLinkErrorPopup() {
  const [visible, setVisible] = useState(true);

  // Rendering
  return visible ? (
    <div className="stale-link-error">
      <img src={staleLogo} alt="Stale link error" />
      <div className="message-container">
        <p><strong>Information no longer available</strong></p>
        <p>The link you followed might be for a closure, delay, or road condition that may have been cleared since the link was created.</p>
      </div>

      <div className="close-btn" aria-label="Close"
        onClick={(event) => {
          event.stopPropagation();
          setVisible(false);
        }}
        onKeyDown={(keyEvent) => {
          if (keyEvent.keyCode === 13) {
            event.stopPropagation();
            setVisible(false);
          }
        }}>
        <FontAwesomeIcon icon={faXmark} />
      </div>
    </div>
  ) : null;
}
