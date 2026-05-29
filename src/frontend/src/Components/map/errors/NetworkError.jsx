// React
import React, { useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { faWifiExclamation } from '@fortawesome/pro-solid-svg-icons';

export default function NetworkErrorPopup(props) {
  // Props
  const { marginPushed } = props;

  const [visible, setVisible] = useState(true);

  // Rendering
  return visible ? (
    <div className={`network-error error-notification ${marginPushed ? 'margin-pushed' : ''}`}>
      <div className="error-icon" alt="Server error" >
        <FontAwesomeIcon icon={faWifiExclamation} />
      </div>
      <div className="message-container">
        <div className="message-header">
          <b>Displaying incomplete information</b>
          <div className="close-btn" aria-label="Close"
            onClick={(event) => {
              event.stopPropagation();
              setVisible(false);
            }}
            onKeyDown={(keyEvent) => {
              if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                keyEvent.stopPropagation();
                setVisible(false);
              }
            }}>
            <FontAwesomeIcon icon={faXmark} />
          </div>
        </div>
        <div>Try refreshing the page or if the problem persists, try again later.</div>
      </div>
    </div>
  ) : null;
}
