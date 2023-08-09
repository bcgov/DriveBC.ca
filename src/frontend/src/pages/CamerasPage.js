// React
import React from 'react';

// Components and functions
import CameraList from '../Components/cameras/CameraList';
import PageHeader from '../PageHeader';
import Footer from '../Footer.js';

export default function CameraPage() {
  return (
    <div className="camera-page">
      <PageHeader
        title="Cameras"
        description="Search by camera name to filter results or scroll to view all cameras sorted by highway.">
      </PageHeader>
      <CameraList></CameraList>
      <Footer />
    </div>
  );
}
