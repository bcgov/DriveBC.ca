// React
import React, { useContext, useEffect } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag
} from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import { CMSContext } from '../../../App';
import { fitMap } from '../helpers';
import { markAdvisoriesAsRead } from "../../data/advisories";
import AdvisoriesList from '../../advisories/AdvisoriesList';

// Styling
import './AdvisoriesPanel.scss';

export default function AdvisoriesPanel(props) {
  const { advisories, openAdvisoriesOverlay, smallScreen, mapView, showRouteObjs } = props;

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  useEffect(() => {
    // Do not update context if the overlay is not open
    if (openAdvisoriesOverlay === false) {
      return;
    }

    markAdvisoriesAsRead(advisories, cmsContext, setCMSContext);
  }, [advisories, openAdvisoriesOverlay]);

  useEffect(() => {
    // Center to the geometric center of all advisories' boundaries for mobile view
    if (smallScreen) {
      const allCoordinates = advisories.map(advisory => advisory.geometry.coordinates).flat(3);
      const simulatedRoute = [{route: allCoordinates}];
      fitMap(simulatedRoute, mapView);
    }
  }, []);

  return (
    <div className="popup popup--advisories" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFlag} />
        </div>

        <p className="name">Advisories</p>
      </div>

      <div className="popup__content">
        <AdvisoriesList advisories={advisories} showDescription={false} showTimestamp={true} showPublished={true} showArrow={true} />
        {advisories.length === 0 && <div className="popup__content">No advisory in view</div>}
      </div>
    </div>
  );
}
