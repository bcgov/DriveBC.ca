// React
import React, { useContext } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareFromSquare } from '@fortawesome/pro-regular-svg-icons';

// Internal imports
import { AlertContext } from '../../App';

// Styling
import './ShareURLButton.scss';

export default function ShareURLButton() {
  /* Setup */
  // Contexts
  const { setAlertMessage } = useContext(AlertContext);

  // Handler
  const copyToClipboard = () => {
    if (navigator.share) {
      navigator.share({
        title: "Share location",
        url: window.location.href

      }).then(() => {
        setAlertMessage(<p>URL shared successfully</p>);

      }).catch((error) => {
        setAlertMessage(<p>Sharing failed: {error.message}</p>);
      });

    } else {
      navigator.clipboard.writeText(window.location.href);
      setAlertMessage(<p>URL copied to clipboard</p>);
    }
  };

  /* Rendering */
  // Main component
  return (
    <div className="share-url">
      <button className="copy-btn" onClick={copyToClipboard}>
        <FontAwesomeIcon icon={faShareFromSquare} />
        <span>Share</span>
      </button>
    </div>
  );
}
