// React
import React from 'react';

// Styling
import './LocationAccessError.scss';

export default function LocationAccessPopup() {
  // Rendering
  return (
    <div className="location-access">
      <div className="message-container">
        <div><b>Location access denied</b></div>
        <div>Your browser does not allow access to your location. To use this feature please allow DriveBC to access your location in your browser or operating system&apos;s settings.</div>
      </div>
    </div>
  );
}
