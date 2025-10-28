// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons';
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
        <div className="popup__title__name">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
            <rect x="1" y="1" width="22" height="22" rx="3" stroke="#448C47" strokeWidth="2"/>
            <path d="M12.5 7.75C12.5 7.35156 12.1484 7 11.75 7C11.3281 7 11 7.35156 11 7.75C11 8.17188 11.3281 8.5 11.75 8.5C12.1484 8.5 12.5 8.17188 12.5 7.75ZM12.9922 9.625H12.9688H13.2266C13.6484 9.625 13.9766 9.97656 13.9766 10.375C13.9766 10.7969 13.6484 11.125 13.2266 11.125H12.4766V16H13.6016C14.8438 16 15.8516 14.9922 15.8516 13.75V13.6094L15.6875 13.7734C15.4766 14.0078 15.125 14.0078 14.8906 13.7734C14.6797 13.5625 14.6797 13.2109 14.8906 12.9766L16.2031 11.6641C16.4375 11.4531 16.7891 11.4531 17 11.6641L18.3125 12.9766C18.5469 13.2109 18.5469 13.5625 18.3125 13.7734C18.1016 14.0078 17.75 14.0078 17.5156 13.7734L17.3516 13.6094V13.75C17.3516 15.8359 15.6875 17.5 13.6016 17.5H11.7266H9.85156C7.78906 17.5 6.10156 15.8359 6.10156 13.75V13.6094L5.9375 13.7734C5.72656 14.0078 5.375 14.0078 5.16406 13.7734C4.92969 13.5625 4.92969 13.2109 5.16406 12.9766L6.47656 11.6641C6.6875 11.4531 7.03906 11.4531 7.27344 11.6641L8.5625 12.9766C8.79688 13.2109 8.79688 13.5625 8.5625 13.7734C8.35156 14.0078 8 14.0078 7.78906 13.7734L7.625 13.6094V13.75C7.625 14.9922 8.63281 16 9.875 16H11V11.125H10.25C9.82812 11.125 9.5 10.7969 9.5 10.375C9.5 9.97656 9.82812 9.625 10.25 9.625H10.4844C9.89844 9.22656 9.5 8.54688 9.5 7.75C9.5 6.50781 10.5078 5.5 11.75 5.5C12.9922 5.5 14 6.50781 14 7.75C14 8.54688 13.6016 9.22656 12.9922 9.625Z" fill="#448C47"/>
          </svg>
          <p className='name'>Coastal ferry</p>
        </div>
        <ShareURLButton/>
      </div>

      <div className="popup__content">
        <div className="popup__content__container">
          <div className="popup__content__title">
            <p className='name'>{`${ferryData.name}`}</p>
          </div>
          <div className="popup__content__info">
            <div className='popup__content__info__container'>
              <p>Click on the links below for schedules on the selected ferry route.</p>
              <div className='popup__content__info__routes'>
                {ferryData.routes.map((ferryRoute, index) => (
                  <a key={index} className="btn btn-outline-primary route-links" href={ferryRoute.url ? ferryRoute.url : "https://www.bcferries.com/routes-fares/discover-route-map"} rel="noopener noreferrer">
                    {ferryRoute.name}
                    <FontAwesomeIcon icon={faChevronRight} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
);
}
