// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMountain } from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import FriendlyTime from '../../../shared/FriendlyTime';
import ShareURLButton from '../../../shared/ShareURLButton';
import WeatherIcon from '../../WeatherIcon';

// Styling
import './HefPanel.scss';

// Main component
export default function HefPanel(props) {
  /* Setup */
  // Props
  const { feature } = props;

  const data = feature.getProperties();

  // Navigation
  const [_searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setSearchParams(new URLSearchParams({ type: 'hef', id: data.id }));
  }, [feature]);

  return (
    <div className="popup popup--weather popup--weather--hef" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faMountain} />
        </div>

        <div className="popup__title__name">
          <p className='name'>High Elevation Forecast</p>
          <ShareURLButton />
        </div>
      </div>

      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{data.name}</p>
          { data.issued_utc && <FriendlyTime date={data.issued_utc} asDate={true} /> }
        </div>

        <div className="popup__content__forecasts">

          { data.forecasts.map((forecast) => (
            <div className='forecast' key={forecast.label}>
              <div className='title'>
                <div className='icon'>
                  <WeatherIcon code={forecast.icon} />
                </div>
                <div className='label'>{forecast.label}</div>
              </div>
              <div className='summary'>{forecast.summary}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
