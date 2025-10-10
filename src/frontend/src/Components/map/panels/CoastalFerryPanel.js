// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnchor } from '@fortawesome/pro-solid-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";

// Internal imports
import ShareURLButton from '../../shared/ShareURLButton';

// Styling
import './CoastalFerryPanel.scss';

export default function CoastalFerryPanel(props) {
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  const { feature, showRouteObjs } = props;

  const ferryData = feature.getProperties();

  const [searchParams, setSearchParams] = useSearchParams();

  // useEffect hooks
  useEffect(() => {
    searchParams.set('type', 'ferry');
    searchParams.set('id', ferryData.id);
    searchParams.delete("display_category");
    setSearchParams(searchParams, { replace: true });
  }, [feature]);

  // Rendering
  // Main component
  return (
    <div className="popup popup--ferry popup--coastal-ferry" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faAnchor}/>
        </div>

        <div className="popup__title__name">
          <p className='name'>Coastal ferries</p>
          <ShareURLButton/>
        </div>
      </div>

      <div className="popup__content">
        <div className="popup__content__container">
          <div className="popup__content__title">
            <p className='name'>{`${ferryData.name}`}</p>
          </div>
          <div className="popup__content__info">
            <div className='popup__content__info__container'>
              <p className='popup__content__info__header'>Routes</p>
              <p>Click on the links below for schedules on the selected ferry route.</p>
              <ul className='popup__content__info__routes'>
                {ferryData.routes.map((ferryRoute, index) => (
                  <li key={index}>
                    <a href={ferryRoute.url ? ferryRoute.url : "https://www.bcferries.com/routes-fares/discover-route-map"} rel="noopener noreferrer">
                      {ferryRoute.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
);
}
