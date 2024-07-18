// React
import React, { useState } from 'react';

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

  // Intentionally using useState to avoid modifying the original array
  const [advisoriesDisplay] = useState(advisories);

  return (
    <div className="popup popup--advisories" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFlag} />
        </div>
        <p className="name">Advisories</p>
      </div>
      <div className="popup__content">
        <AdvisoriesList advisories={advisoriesDisplay} showDescription={false} showTimestamp={true} showArrow={true} />
      </div>
    </div>
  );
}
