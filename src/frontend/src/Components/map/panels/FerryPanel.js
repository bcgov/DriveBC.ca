// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFerry } from '@fortawesome/pro-solid-svg-icons';
import parse from 'html-react-parser';

// Internal imports
import ShareURLButton from '../../shared/ShareURLButton';

// Styling
import './FerryPanel.scss';

export default function FerryPanel(props) {
  const { feature } = props;

  const ferryData = feature.getProperties();

  const [_searchParams, setSearchParams] = useSearchParams();

  // useEffect hooks
  useEffect(() => {
    setSearchParams(new URLSearchParams({ type: 'ferry', id: ferryData.id }));
  }, [feature]);

  return (
    <div className="popup popup--ferry" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFerry} />
        </div>
        <div className="popup__title__name">
          <p className='name'><a
            href={ferryData.url}
            target="_blank"
            rel="noreferrer">{`${ferryData.title}`}</a>
          </p>
          <ShareURLButton />
        </div>   
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
