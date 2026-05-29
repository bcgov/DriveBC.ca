// React
import React, { useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';

export default function ServerErrorPopup(props) {
  // Props
  const { marginPushed } = props;

  const [visible, setVisible] = useState(true);

  // Rendering
  return visible ? (
    <div className={`server-error error-notification ${marginPushed ? 'margin-pushed' : ''}`}>
      <div className="error-icon" alt="Server error" >
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>
      <div className="message-container">
        <div className="message-header">
          <b>Page information not updated recently</b>
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
        <div>Check your network connection, refresh the page, or try again later.</div>
      </div>
    </div>
  ) : null;
}
