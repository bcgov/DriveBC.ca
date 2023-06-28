import React from 'react';
import CameraList from '../Components/cameras/CameraList';
import PageHeader from '../PageHeader';

export default function CameraPage() {
  return (
    <div className="camera-page">
      <PageHeader
        title="Cameras"
        description="Search by camera name to filter results or scroll to view all cameras sorted by highway.">
      </PageHeader>
      <CameraList></CameraList>
    </div>
  );
}