// React
import React from 'react';

// Third party packages
import parse from 'html-react-parser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFerry,
  faFlag
} from '@fortawesome/pro-solid-svg-icons';
import AdvisoriesList from '../../advisories/AdvisoriesList';

// Styling
import './FerryPanel.scss';

export default function FerryPanel(props) {
  const { feature } = props;

  const ferryData = feature.getProperties();

  return (
    <div className="popup popup--ferry" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFerry} />
        </div>
        <p className="name">
          <a
            href={ferryData.url}
            target="_blank"
            rel="noreferrer">{`${ferryData.title}`}</a>
        </p>
      </div>
      <div className="popup__content">
        {ferryData.image_url && (
          <div className="popup__content__image">
            <img src={ferryData.image_url} alt={ferryData.title} />
          </div>
        )}

        <div className="popup__content__description">
          <p>{parse(ferryData.description)}</p>
          <p>{parse(ferryData.seasonal_description)}</p>
          <p>{parse(ferryData.service_hours)}</p>
        </div>
      </div>
    </div>
  );
}

export function showAdvisories(advisories) {
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
