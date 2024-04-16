// React
import React from 'react';

// Images
import errorLogo from '../../../images/status-error.svg';

// Styling
import './NetworkError.scss';

export default function NetworkErrorPopup() {
  // Rendering
  return (
    <div className="network-error">
      <img src={errorLogo} alt="Network error" />
      <div className="message-container">
        <div><b>Displaying incomplete information</b></div>
        <div>Try refreshing the page or if the problem persists, try again later.</div>
      </div>
    </div>
  );
}
