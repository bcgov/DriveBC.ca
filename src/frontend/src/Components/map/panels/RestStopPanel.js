// React
import React, { useEffect, useContext } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChargingStation,
  faClock,
  faDoorOpen,
  faRoad,
  faTablePicnic,
  faToilet,
  faTruckContainer,
  faWifi,
} from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

// Internal imports
import { isRestStopClosed } from '../../data/restStops';
import OpenSeason from '../OpenSeason';
import RestStopTypeIcon from '../RestStopTypeIcon';
import ShareURLButton from '../../shared/ShareURLButton';
import { MapContext } from '../../../App';

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
  // Misc
  const smallScreen = useMediaQuery('only screen and (max-width: 575px)');

  const { feature, showRouteObjs } = props;

  const restStopData = feature.getProperties();
  const isClosed = isRestStopClosed(restStopData.properties);

  const [searchParams, setSearchParams] = useSearchParams();

  // Context
  const { mapContext } = useContext(MapContext);

  // useEffect hooks
  useEffect(() => {
    const isLargeRestStop = mapContext.visible_layers.largeRestStops;
    const featureType = isLargeRestStop && feature.get("properties").ACCOM_COMMERCIAL_TRUCKS == 'Yes' ? 'largeRestStop' : 'restStop';

    searchParams.set('type', featureType);
    searchParams.set('id', restStopData.id);
    searchParams.delete("display_category");
    setSearchParams(searchParams, { replace: true });
  }, [feature]);

  return (
    <div className={`popup popup--reststop ${isClosed ? 'closed' : ''}`} tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
          <RestStopTypeIcon reststop={restStopData} />
            {isClosed ? (
              <div className='name-div'>
                <p className='name'>Rest area</p>
                <p className="label red-text">Closed</p>
              </div>
              ) : (<p className='name'>Rest area</p>
              )}
        </div>
        <ShareURLButton/>
      </div>
      <div className="popup__content">
        <div className="popup__content__title">
        <p className="name">{restStopData.properties.REST_AREA_NAME}</p>
          <p className="location">{restStopData.properties.DISTANCE_FROM_MUNICIPALITY}</p>
        </div>
        <div className='popup__content__description'>
          <p className="description-label label">Access</p>
          <div className="data-card">
            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon icon={faClock}/>
              </div>
                {restStopData.properties.OPEN_YEAR_ROUND === "Yes" && (
                  <p className="label">Open year round</p>
                )}
                {restStopData.properties.OPEN_YEAR_ROUND === "No" && restStopData.properties.OPEN_DATE && restStopData.properties.CLOSE_DATE && (
                  <div>
                      {<OpenSeason returnState={true} openDate={restStopData.properties.OPEN_DATE} closeDate={restStopData.properties.CLOSE_DATE} /> === "open" ? (
                        <p className="label">Open seasonally</p>
                        ) : ( isRestStopClosed(restStopData.properties) ? (<p className="label">Closed &#40;open seasonally&#41;</p>)
                        : (<p className="label">Open seasonally</p>)
                      )}
                  </div>
                )}
                {restStopData.properties.OPEN_YEAR_ROUND === "No" && !restStopData.properties.OPEN_DATE && !restStopData.properties.CLOSE_DATE && (
                  <p className="label red-text">Closed</p>
                )}
              <p className="data">
                {restStopData.properties.OPEN_YEAR_ROUND === "No" && restStopData.properties.OPEN_DATE && restStopData.properties.CLOSE_DATE && (
                  <OpenSeason openDate={restStopData.properties.OPEN_DATE} closeDate={restStopData.properties.CLOSE_DATE} />
                )}
              </p>
            </div>

            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon icon={faDoorOpen} />
              </div>
              <p className="label">
                Entrance
              </p>
              <div className="datas">
                <p className="data">
                  {restStopData.properties.DIRECTION_OF_TRAFFIC} entrance
                </p>
                {restStopData.properties.ACCESS_RESTRICTION === "No Restriction" ? (
                  <p className="data-label">Accessible from both directions</p>
                ) : (
                  <p className="data-label">No <span className="lowercase">{restStopData.properties.ACCESS_RESTRICTION}</span> access</p>
                )}
              </div>
            </div>

            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon icon={faTruckContainer} />
              </div>
              <p className="label">
                Large vehicles
              </p>
              {restStopData.properties.ACCOM_COMMERCIAL_TRUCKS === "Yes" ? (
                  <p className="data">Accomodated</p>
                ) : (
                  <p className="data red-text">Not accomodated</p>
              )}
            </div>
          </div>
        </div>

        <div className='popup__content__description'>
          <p className="description-label label">Features</p>

          <div className="data-card">
            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon icon={faToilet} />
              </div>
              <p className="label">
                Toilets
              </p>
              <div className="datas">
                <p className="data">
                  {restStopData.properties.NUMBER_OF_TOILETS} {restStopData.properties.TOILET_TYPE} toilet{restStopData.properties.NUMBER_OF_TOILETS > 1 ? 's' : ''}
                </p>
                <p className="label data-label">
                  {restStopData.properties.WHEELCHAIR_ACCESS_TOILET === "Yes" ? (
                  'Wheelchair accessible'
                  ) : (
                    'Not wheelchair accessible'
                  )}
                </p>
              </div>
            </div>
            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon icon={faTablePicnic} />
              </div>
              <p className="label">
                Tables
              </p>
                <p className="data">
                  {restStopData.properties.NUMBER_OF_TABLES !== 0 && restStopData.properties.NUMBER_OF_TABLES !== null ? (
                    `${restStopData.properties.NUMBER_OF_TABLES} tables`
                  ) : (
                    `No tables`
                  )}
                </p>
            </div>
            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon icon={faWifi} />
              </div>
              <p className="label">
                Wifi
              </p>
              <p className="data">
              {restStopData.properties.WI_FI === "No" ? (
                `Wi-Fi unavailable`
              ) : (
                `Wi-Fi available`
              )}
              </p>
            </div>
            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon icon={faRoad} />
              </div>
              <p className="label">
                Lanes
              </p>
              {(restStopData.properties.ACCELERATION_LANE === "No" &&
                restStopData.properties.DECELERATION_LANE === "No") && (
                <div className="datas">
                  <p className="data">No acceleration</p>
                  <p className="data">and deceleration</p>
                </div>
              )}
              {(restStopData.properties.ACCELERATION_LANE === "Yes" &&
                restStopData.properties.DECELERATION_LANE === "Yes") && (
                <div className="datas">
                  <p className="data">Has acceleration</p>
                  <p className="data">and deceleration</p>
                </div>
              )}
              {(restStopData.properties.ACCELERATION_LANE === "Yes" &&
                restStopData.properties.DECELERATION_LANE === "No") && (
                <div className="datas">
                  <p className="data">Has acceleration</p>
                  <p className="data">No deceleration</p>
                </div>
              )}
              {(restStopData.properties.ACCELERATION_LANE === "No" &&
                restStopData.properties.DECELERATION_LANE === "Yes") && (
                <div className="datas">
                  <p className="data">No acceleration</p>
                  <p className="data">Has deceleration</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='popup__content__description'>
          <div className='popup__content__description__row'>
            <p className='description-label label'>Electric Vehicles</p>
            <a href="https://www.plugshare.com/"  className="footer-link" rel="noreferrer" alt="Disclaimer" >View on Plugshare</a>
          </div>
          <div className="data-card">
            <div className="data-card__row">
              <div className="data-icon">
                <FontAwesomeIcon icon={faChargingStation}/>
              </div>
              <p className="label">Charging</p>
              <div className="datas">
                {restStopData.properties.EV_STATION_25_KW_DCFC === 0
                && restStopData.properties.EV_STATION_50_KW_DCFC === 0
                && restStopData.properties.EV_STATION_LEVEL_2_J1772 === 0 && (
                  <p className="data">No charging stations</p>
                )}
                  
                {restStopData.properties.EV_STATION_25_KW_DCFC !== 0 && (
                  <p className="data">
                    <span className="count">{restStopData.properties.EV_STATION_25_KW_DCFC} </span>
                    25KW
                  </p>
                )}

                {restStopData.properties.EV_STATION_50_KW_DCFC !== 0 && (
                  <p className="data">
                    <span className="count">{restStopData.properties.EV_STATION_50_KW_DCFC}</span>
                    50KW
                  </p>
                )}

                {restStopData.properties.EV_STATION_LEVEL_2_J1772 !== 0 && (
                  <p className="data">
                    <span className="count">{restStopData.properties.EV_STATION_LEVEL_2_J1772}</span>
                    Level 2 &#40;J1772&#41;
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
