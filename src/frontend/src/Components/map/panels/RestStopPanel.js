// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChargingStation,
  faCircleInfo,
  faClock,
  faDoorOpen,
  faRoad,
  faTablePicnic,
  faToilet,
  faTruckContainer,
  faWifi,
} from '@fortawesome/pro-solid-svg-icons';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

// Internal imports
import { isRestStopClosed } from '../../data/restStops';
import OpenSeason from '../OpenSeason';
import RestStopTypeIcon from '../RestStopTypeIcon';
import ShareURLButton from '../../shared/ShareURLButton';

// Styling
import './RestStopPanel.scss';

// Helper components
const tooltipLargeVehicles = (
  <Tooltip id="tooltipLargeVehicles" className="tooltip-content">
    <p>A commercial vehicle is defined as one that is larger than 20 metres &#40;66 feet&#41; in length.</p>
  </Tooltip>
);

// Main component
export default function RestStopPanel(props) {
  const { feature } = props;

  const restStopData = feature.getProperties();

  const [_searchParams, setSearchParams] = useSearchParams();

  // useEffect hooks
  useEffect(() => {
    const featureType = feature.getProperties().properties.ACCOM_COMMERCIAL_TRUCKS == 'Yes' ? 'largeRestStop' : 'restStop';
    setSearchParams(new URLSearchParams({ type: featureType, id: restStopData.id }));
  }, [feature]);

  return (
    <div className="popup popup--reststop" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <RestStopTypeIcon reststop={restStopData} state="active" />
        </div>
        <div className="popup__title__name">
          <p className='name'>Rest area</p>
          <ShareURLButton />
        </div>
      </div>
      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{restStopData.properties.REST_AREA_NAME}</p>
          <p className="location">{restStopData.properties.DISTANCE_FROM_MUNICIPALITY}</p>
        </div>
        <hr/>
        <div className='popup__content__description'>
          <p className="description-label label">Access</p>
          <div className='popup__content__description__container'>
            <div className='popup__content__description__container__row'>
              <FontAwesomeIcon icon={faClock} />
              {restStopData.properties.OPEN_YEAR_ROUND === "Yes" && (
                <p className="green-text">Open year round</p>
              )}
              {restStopData.properties.OPEN_YEAR_ROUND === "No" && restStopData.properties.OPEN_DATE && restStopData.properties.CLOSE_DATE && (
                <div>
                    {<OpenSeason returnState={true} openDate={restStopData.properties.OPEN_DATE} closeDate={restStopData.properties.CLOSE_DATE} /> === "open" ? (
                      <p className="green-text">Open seasonally</p>
                      ) : ( isRestStopClosed(restStopData.properties)? (<p className="red-text">Closed &#40;open seasonally&#41;</p>)
                      : (<p className="green-text">Open seasonally</p>)
                    )}
                    <OpenSeason openDate={restStopData.properties.OPEN_DATE} closeDate={restStopData.properties.CLOSE_DATE} />
                </div>
              )}
              {restStopData.properties.OPEN_YEAR_ROUND === "No" && !restStopData.properties.OPEN_DATE && !restStopData.properties.CLOSE_DATE && (
                <p className="red-text">Closed</p>
              )}
            </div>
            <div className='popup__content__description__container__row'>
              <FontAwesomeIcon icon={faDoorOpen} />
              <div>
                <p>{restStopData.properties.DIRECTION_OF_TRAFFIC} entrance</p>
                {restStopData.properties.ACCESS_RESTRICTION === "No Restriction" ? (
                  <p>Accessible from both directions</p>
                ) : (
                  <p>No <span className="lowercase">{restStopData.properties.ACCESS_RESTRICTION}</span> access</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <hr/>
        <div className='popup__content__description'>
          <p className="description-label label">Features</p>
          <div className='popup__content__description__container'>
            <div className='popup__content__description__container__row'>
              <FontAwesomeIcon icon={faToilet} />
              <div>
                <p className="toilets">{restStopData.properties.NUMBER_OF_TOILETS} {restStopData.properties.TOILET_TYPE} toilet{restStopData.properties.NUMBER_OF_TOILETS > 1 ? 's' : ''}</p>
                <p>
                  {restStopData.properties.WHEELCHAIR_ACCESS_TOILET === "Yes" ? (
                  'Wheelchair accessible'
                  ) : (
                    'Not wheelchair accessible'
                  )}
                </p>
              </div>
            </div>
            <div className='popup__content__description__container__row'>
              <FontAwesomeIcon icon={faTablePicnic} />
              <p>
                {restStopData.properties.NUMBER_OF_TABLES !== 0 && restStopData.properties.NUMBER_OF_TABLES !== null ? (
                  `${restStopData.properties.NUMBER_OF_TABLES} tables`
                ) : (
                  `No tables`
                )}
              </p>
            </div>
            <div className='popup__content__description__container__row'>
              <FontAwesomeIcon icon={faWifi} />
              <p>
                {restStopData.properties.WI_FI === "No" ? (
                  `Wi-Fi unavailable`
                ) : (
                  `Wi-Fi available`
                )}
              </p>
            </div>
          </div>
        </div>

        <hr/>
        <div className='popup__content__description'>
          <div className='popup__content--row'>
            <p className="description-label label">Commercial Vehicles</p>
            <OverlayTrigger placement="top" overlay={tooltipLargeVehicles}>
              <button className="tooltip-vehicles" aria-label="commercial vehicles info" aria-describedby="tooltipLargeVehicles"><FontAwesomeIcon icon={faCircleInfo} /></button>
            </OverlayTrigger>
          </div>
          <div className='popup__content__description__container'>
            <div className='popup__content__description__container__row'>
              <FontAwesomeIcon icon={faTruckContainer} />
              {restStopData.properties.ACCOM_COMMERCIAL_TRUCKS === "Yes" ? (
                  <p>Vehicles longer than 20 metres (66 feet) allowed</p>
                ) : (
                  <p className="red-text">Vehicles longer than 20 metres (66 feet) not allowed</p>                  
              )}
            </div>
            <div className='popup__content__description__container__row'>
              <FontAwesomeIcon icon={faRoad} />
              {(restStopData.properties.ACCELERATION_LANE === "No" &&
                restStopData.properties.DECELERATION_LANE === "No") && (
                <p>No acceleration and deceleration lanes</p>
              )}
              {(restStopData.properties.ACCELERATION_LANE === "Yes" &&
                restStopData.properties.DECELERATION_LANE === "Yes") && (
                <p>Has acceleration and deceleration lanes</p>
              )}
              {(restStopData.properties.ACCELERATION_LANE === "Yes" &&
                restStopData.properties.DECELERATION_LANE === "No") && (
                <div>
                  <p>Has acceleration lane</p>
                  <p>No deceleration lane</p>
                </div>
              )}
              {(restStopData.properties.ACCELERATION_LANE === "No" &&
                restStopData.properties.DECELERATION_LANE === "Yes") && (
                <div>
                  <p>No acceleration lane</p>
                  <p>Has deceleration lane</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <hr/>
        <div className='popup__content__description'>
          <div className='popup__content__description__row'>
          <p className='description-label label'>Electric Vehicles</p>
          <a href="https://www.plugshare.com/"  className="footer-link label" target="_blank" rel="noreferrer" alt="Disclaimer" >View on Plugshare</a>
          </div>
          <div className='popup__content__description__container'>
            {restStopData.properties.EV_STATION_25_KW_DCFC === 0
              && restStopData.properties.EV_STATION_50_KW_DCFC === 0
              && restStopData.properties.EV_STATION_LEVEL_2_J1772 === 0 && (
            <div className='popup__content__description__container__row'>
              <FontAwesomeIcon icon={faChargingStation} />
              <p>No charging stations</p>
            </div>
            )}

            {restStopData.properties.EV_STATION_25_KW_DCFC !== 0 && (
              <div className='popup__content__description__container__row'>
                <FontAwesomeIcon icon={faChargingStation} />
                <p>25KW</p>
                <p className="count">{restStopData.properties.EV_STATION_25_KW_DCFC}</p>
              </div>
            )}

            {restStopData.properties.EV_STATION_50_KW_DCFC !== 0 && (
              <div className='popup__content__description__container__row'>
                <FontAwesomeIcon icon={faChargingStation} />
                <p>50KW</p>
                <p className="count">{restStopData.properties.EV_STATION_50_KW_DCFC}</p>
              </div>
            )}

            {restStopData.properties.EV_STATION_LEVEL_2_J1772 !== 0 && (
              <div className='popup__content__description__container__row'>
                <FontAwesomeIcon icon={faChargingStation} />
                <p>Level 2 &#40;J1772&#41;</p>
                <p className="count">{restStopData.properties.EV_STATION_LEVEL_2_J1772}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
