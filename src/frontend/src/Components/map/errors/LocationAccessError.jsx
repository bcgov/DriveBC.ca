// React
import React from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { faCloudExclamation } from '@fortawesome/pro-solid-svg-icons';

export default function LocationAccessPopup(props) {
  // Props
  const { marginPushed, setShowLocationAccessError } = props;

  // Rendering
  return (
    <div className={`location-access-error error-notification ${marginPushed ? 'margin-pushed' : ''}`}>
      <div className="error-icon" alt="Location access error">
        <FontAwesomeIcon icon={faCloudExclamation} />
      </div>

      <div className="message-container">
        <div className="message-header">
          <b>Location access denied</b>
          <div className="close-btn" aria-label="Close"
            onClick={(event) => {
              event.stopPropagation();
              setShowLocationAccessError(false);
            }}
            onKeyDown={(keyEvent) => {
              if (['Enter', 'NumpadEnter'].includes(keyEvent.key)) {
                keyEvent.stopPropagation();
                setShowLocationAccessError(false);
              }
            }}>
            <FontAwesomeIcon icon={faXmark} />
          </div>
        </div>

        <div>Your browser does not allow access to your location. To use this feature please allow DriveBC to access your location in your browser or operating system&apos;s settings.</div>
      </div>
    </div>
  );
}
