// React
import React from 'react';

// Internal imports
import Footer from '../Footer';

// Styling
import './MaintenancePage.scss';

export default function MaintenancePage() {
  document.title = 'DriveBC - Maintenance';

  return (
    <div className='maintenance-page'>
      {/* Changed from Container to div */}
      <div className='text-container'>
        <h1>DriveBC is currently down for maintenance</h1>
        <p>We're working on getting the site back up again as soon as possible.</p>
        <p>In the meantime, please visit the <a href="https://twitter.com/DriveBC" rel="noreferrer" target="_blank" alt="Twitter" > DriveBC X (Twitter)</a> page for updates.</p>
      </div>

      <Footer />
    </div>
  );
}