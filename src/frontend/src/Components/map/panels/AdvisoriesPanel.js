// React
import React from 'react';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag
} from '@fortawesome/pro-solid-svg-icons';
import AdvisoriesList from '../../advisories/AdvisoriesList';

// Styling
import './AdvisoriesPanel.scss';

export default function AdvisoriesPanel(props) {
  const { advisories } = props;

  return (
    <div className="popup popup--advisories" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFlag} />
        </div>
        <p className="name">Advisories</p>
      </div>
      <div className="popup__content">
        <AdvisoriesList advisories={advisories} showDescription={false} showTimestamp={false} showArrow={true} />
      </div>
    </div>
  );
}
