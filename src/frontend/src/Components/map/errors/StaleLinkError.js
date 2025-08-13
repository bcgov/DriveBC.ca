// React
import React, { useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons'
import { useMediaQuery } from '@uidotdev/usehooks';

// Images
import staleLogo from '../../../images/status-stale.svg';

export default function StaleLinkErrorPopup(props) {
  // Props
  const { marginPushed } = props;

  const [visible, setVisible] = useState(true);

  // Rendering
  return visible ? (
    <div className={`stale-link-error error-notification ${marginPushed ? 'margin-pushed' : ''}`}>
      <div className="error-icon" alt="Stale link error" >
        <FontAwesomeIcon icon={faTriangleExclamation} />
      </div>
      <div className="message-container">
        <div className="message-header">
          <b>Information no longer available</b>
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
        <div>The link you followed might be for a closure, delay, or road condition that may have been cleared since the link was created.</div>
      </div>
    </div>
  ) : null;
}
