// React
import React, { useRef, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareFromSquare } from '@fortawesome/pro-regular-svg-icons';

// Internal imports
import Alert from './Alert';

// Styling
import './ShareURLButton.scss';

export default function ShareURLButton() {
  /* Setup */
  // Refs
  const timeout = useRef();

  // States
  const [showAlert, setShowAlert] = useState(false);

  // Handler
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);

    setShowAlert(true);

    // Clear existing close alert timers
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    // Set new close alert timer to reference
    timeout.current = setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  };

  /* Rendering */
  // Sub components
  const getAlertMessage = () => {
    return <p>URL copied to clipboard</p>;
  };

  // Main component
  return (
    <div className="share-url">
      <button className="copy-btn" onClick={copyToClipboard}>
        <FontAwesomeIcon icon={faShareFromSquare} />
        <span>Share</span>
      </button>

      <Alert showAlert={showAlert} setShowAlert={setShowAlert} message={getAlertMessage()} />
    </div>
  );
}
