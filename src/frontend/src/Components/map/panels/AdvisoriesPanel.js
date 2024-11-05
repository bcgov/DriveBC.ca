// React
import React, { useContext, useEffect } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag
} from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import { CMSContext } from '../../../App';
import AdvisoriesList from '../../advisories/AdvisoriesList';

import { fitMap } from '../helpers';

// Styling
import './AdvisoriesPanel.scss';

export default function AdvisoriesPanel(props) {
  const { advisories, openAdvisoriesOverlay, smallScreen, mapView } = props;

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  useEffect(() => {
    // Do not update context if the overlay is not open
    if (openAdvisoriesOverlay === false) {
      return;
    }

    const advisoriesIds = advisories.map(advisory => advisory.id.toString() + '-' + advisory.live_revision.toString());

    // Combine and remove duplicates
    const readAdvisories = Array.from(new Set([...advisoriesIds, ...cmsContext.readAdvisories]));
    const updatedContext = {...cmsContext, readAdvisories: readAdvisories};

    setCMSContext(updatedContext);
    localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
  }, [advisories, openAdvisoriesOverlay]);

  useEffect(() => {
    // Center to the geometric center of all advisories' boundaries for mobile view
    if(smallScreen){
      const allCoordinates = advisories.map(advisory => advisory.geometry.coordinates).flat(3);
      const simulatedRoute = [{route: allCoordinates}];
      fitMap(simulatedRoute, mapView);
    }
  }, []);

  return (
    <div className="popup popup--advisories" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFlag} />
        </div>
        <p className="name">Advisories</p>
      </div>
      <div className="popup__content">
        <AdvisoriesList advisories={advisories} showDescription={false} showTimestamp={true} showArrow={true} />
        {advisories.length === 0 && <div className="popup__content">No advisory in view</div>}
      </div>
    </div>
  );
}
