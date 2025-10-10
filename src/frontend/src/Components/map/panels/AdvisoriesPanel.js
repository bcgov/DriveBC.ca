// React
import React, { useContext, useEffect } from 'react';

// Navigation
import { useSearchParams } from "react-router-dom";

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
import ShareURLButton from '../../shared/ShareURLButton';

// Styling
import './AdvisoriesPanel.scss';

export default function AdvisoriesPanel(props) {
  // Props
  const { advisories, openAdvisoriesOverlay, smallScreen, mapView, showRouteObjs, inMap } = props;

  // Navigation
  const [searchParams, setSearchParams] = useSearchParams();

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  useEffect(() => {
    // Do not update context if the overlay is not open
    if (openAdvisoriesOverlay === false) {
      return;
    }

    markAdvisoriesAsRead(inMap ? [advisories] : advisories, cmsContext, setCMSContext);

    if (inMap && advisories) {
      searchParams.set("type", 'advisory');
      searchParams.set("id", advisories.id);
      searchParams.delete("display_category");
      setSearchParams(searchParams, { replace: true });
    }
  }, [advisories, openAdvisoriesOverlay]);

  useEffect(() => {
    // Temporarily disabled since we are no longer rendering a list of advisories in map
    // Center to the geometric center of all advisories' boundaries for mobile view
    // if (smallScreen) {
    //   const allCoordinates = advisories.map(advisory => advisory.geometry.coordinates).flat(3);
    //   const simulatedRoute = [{route: allCoordinates}];
    //   fitMap(simulatedRoute, mapView);
    // }
  }, []);

  return (
    <div className="popup popup--advisories" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
          <rect x="1" y="1" width="22" height="22" rx="3" stroke="#F24C27" strokeWidth="2"/>
          <path d="M8.375 7.0625V7.40625L9.85742 7.04102C10.6738 6.84766 11.5332 6.93359 12.2852 7.32031C13.2734 7.81445 14.4551 7.81445 15.4434 7.32031L15.6582 7.21289C16.0879 6.97656 16.625 7.29883 16.625 7.79297V13.1211C16.625 13.4219 16.4316 13.6582 16.1738 13.7656L15.4219 14.0449C14.4336 14.4316 13.3379 14.3672 12.3711 13.8945C11.5547 13.4863 10.6309 13.3789 9.75 13.5938L8.375 13.9375V16.6875C8.375 17.0742 8.05273 17.375 7.6875 17.375C7.30078 17.375 7 17.0742 7 16.6875V14.2812V7.75V7.0625C7 6.69727 7.30078 6.375 7.6875 6.375C8.05273 6.375 8.375 6.69727 8.375 7.0625Z" fill="#F24C27"/>
        </svg>
          <p className="name">Advisories</p>
        </div>
        <ShareURLButton />
      </div>

      <div className="popup__content">
        <AdvisoriesList advisories={inMap ? [advisories] : advisories} showDescription={false} showTimestamp={true} showPublished={true} showArrow={true} />
        {advisories.length === 0 && <div className="popup__content">No advisory in view</div>}
      </div>
    </div>
  );
}
