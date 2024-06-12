// React
import React from 'react';

// Internal imports
import { ReportMap } from '../Components/report/ReportMap';
import Footer from '../Footer';
import PageHeader from '../PageHeader';

// Styling
import './ReportRoadPage.scss';

export default function ReportRoadPage() {
  document.title = `DriveBC - Report Road Maintenance`;

  // Rendering
  return (
    <div className='report-page'>
      <PageHeader
        title="Highway or bridge problem"
        description="Report highway or bridge problems. Examples include: pot holes, road damage, bridge damage, signage damage, drainage issues, fallen trees, fallen rocks, or animal carcasses."
        description2="Select the area of the province where you have encountered the highway or bridge problem. If your location is known, it is selected and shown on the map.">
      </PageHeader>

      <ReportMap wmsLayer='hwy:DSA_CONTRACT_AREA_INFO_V' />

      <Footer />
    </div>
  );
}
