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

// Styling
import './AdvisoriesPanel.scss';

export default function AdvisoriesPanel(props) {
  const { advisories } = props;

  // Context
  const { cmsContext, setCMSContext } = useContext(CMSContext);

  useEffect(() => {
    const advisoriesIds = advisories.map(advisory => advisory.id);

    // Combine and remove duplicates
    const readAdvisories = Array.from(new Set([...advisoriesIds, ...cmsContext.readAdvisories]));
    const updatedContext = {...cmsContext, readAdvisories: readAdvisories};

    setCMSContext(updatedContext);
    localStorage.setItem('cmsContext', JSON.stringify(updatedContext));
  }, [advisories]);

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
      </div>
    </div>
  );
}
