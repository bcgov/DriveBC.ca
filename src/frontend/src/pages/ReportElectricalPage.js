// React
import React from 'react';

// Internal imports
import { ReportMap } from '../Components/report/ReportMap';
import Footer from '../Footer';
import PageHeader from '../PageHeader';

// Styling
import './ReportElectricalPage.scss';

export default function ReportElectricalPage() {
  document.title = `DriveBC - Report Electrical Problem`;

  // Rendering
  return (
    <div className='report-page'>
      <PageHeader
        title="Road electrical problem"
        description="Report an electrical issue on a highway or bridge. Examples include: overhead signs, street lights, pedestrian lighting, signals out, or signals damaged."
        description2="Select the area of the province where you have encountered electrical problem. If your location is known, it is selected and shown on the map.">
      </PageHeader>

      <ReportMap wmsLayer='hwy:DSA_ELECTRICAL_CA_INFO_V' />

      <Footer />
    </div>
  );
}
