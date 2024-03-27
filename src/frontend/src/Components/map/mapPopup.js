// React
import React from 'react';

// Third party packages
import EventTypeIcon from '../EventTypeIcon';
import FriendlyTime from '../FriendlyTime';
import parse from 'html-react-parser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFerry,
  faTemperatureHalf,
  faMountain,
  faDroplet,
  faSnowflake,
  faWind,
  faEye,
  faTriangleExclamation,
  faToilet,
  faBath,
  faRestroom,
  faClock,
  faDoorOpen,
  faTruck,
  faTable,
  faWifi,
  faRoad,
  faChargingStation,
} from '@fortawesome/free-solid-svg-icons';
import { 
  faTablePicnic,
  faTruckContainer,
} from '@fortawesome/pro-solid-svg-icons';
import {
  faSunCloud
} from '@fortawesome/pro-solid-svg-icons';

import './mapPopup.scss';

function convertCategory(event) {
  switch (event.display_category) {
    case 'closures':
      return 'Closure';
    case 'majorEvents':
      return event.event_type === 'INCIDENT'
        ? 'Major incident '
        : 'Major delay';
    case 'minorEvents':
      return event.event_type === 'INCIDENT'
        ? 'Minor incident '
        : 'Minor delay';
    case 'futureEvents':
      return event.severity === 'MAJOR'
        ? 'Major future event'
        : 'Minor future event';
    case 'roadConditions':
      return 'Road condition';
    default:
      return '';
  }
}

function convertDirection(direction) {
  switch (direction) {
    case 'N':
      return 'Northbound';
    case 'W':
      return 'Westbound';
    case 'E':
      return 'Eastbound';
    case 'S':
      return 'Southbound';
    case 'BOTH':
      return 'Both Directions';
    case 'NONE':
      return ' ';
    default:
      return ' ';
  }
}

export function getEventPopup(eventFeature) {
  const eventData = eventFeature.ol_uid
    ? eventFeature.getProperties()
    : eventFeature;
  const severity = eventData.severity.toLowerCase();

  return (
    <div
      className={`popup popup--event ${eventData.display_category} ${severity}`}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <EventTypeIcon event={eventData} state="active" />
        </div>
        <p className="name">{convertCategory(eventData)}</p>
      </div>

      <div className="popup__content">
        <div className="popup__content__title">
          <p className="direction">{convertDirection(eventData.direction)}</p>
          <p className="name">{eventData.highway_segment_names ? eventData.highway_segment_names : eventData.route_at}</p>
          <p className="location">{eventData.location_description}</p>
        </div>

        {eventData.closest_landmark &&
          <div className="popup__content__description">
            <p>Closest Landmark</p>
            <p>{eventData.closest_landmark}</p>
          </div>
        }

        <div className="popup__content__description">
          <p>Description</p>
          <p>{eventData.optimized_description}</p>
        </div>

        <div className="popup__content__block">
          <div className="popup__content__description">
            <p>Last update</p>
            <FriendlyTime date={eventData.last_updated} />
          </div>

          {eventData.next_update &&
            <div className="popup__content__description">
              <p>Next update</p>
              <FriendlyTime date={eventData.next_update} />
            </div>
          }

        </div>

        
      </div>
    </div>
  );
}

export function getFerryPopup(ferryFeature) {
  const ferryData = ferryFeature.getProperties();

  return (
    <div className="popup popup--ferry">
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
export function getWeatherPopup(weatherFeature) {
  const weatherData = weatherFeature.getProperties();

  return (
    <div className="popup popup--road-weather">
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faTemperatureHalf} />
        </div>
        <p className="name">Local Weather</p>
        <span className="sub-name">Weather Stations</span>
      </div>
      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{weatherData.weather_station_name}</p>
          <FriendlyTime date={weatherData.issuedUtc} />
          <p className="description">{weatherData.location_description}</p>
        </div>
        <div className="popup__content__description">
          { weatherData.road_condition && (
            <div className="road-condition">
              <p className="data">{weatherData.road_condition}</p>
              <p className="label">Road Condition</p>
            </div>
          )}

          {(weatherData.air_temperature || weatherData.road_temperature) && (
            <div className="temperatures">
              {weatherData.air_temperature && (
                <div className="temperature temperature--air">
                  <p className="data">{weatherData.air_temperature}</p>
                  <p className="label">Air</p>
                </div>
              )}
              {weatherData.road_temperature && (
                <div className="temperature temperature--road">
                  <p className="data">{weatherData.road_temperature}</p>
                  <p className="label">Road</p>
                </div>
              )}
            </div>
          )}
          <div className="data-card">
            {weatherData.elevation && (
              <div className="data-card__row">
                <div className="data-icon">
                  <FontAwesomeIcon className="icon" icon={faMountain} />
                </div>
                <p className="label">Elevation</p>
                <p className="data">{weatherData.elevation}</p>
              </div>
            )}
            {weatherData.precipitation && (
              <div className="data-card__row">
                <div className="data-icon">
                  <FontAwesomeIcon className="icon" icon={faDroplet} />
                </div>
                <p className="label">Precipitation (last 12 hours)</p>
                <p className="data">{weatherData.precipitation}</p>
              </div>
            )}
            {weatherData.snow && (
              <div className="data-card__row">
                <div className="data-icon">
                  <FontAwesomeIcon className="icon" icon={faSnowflake} />
                </div>
                <p className="label">Snow (last 12 hours)</p>
                <p className="data">{weatherData.snow}</p>
              </div>
            )}
            {(weatherData.average_wind ||
              weatherData.maximum_wind) && (
                <div className="data-card__row data-card__row group">
                  <div className="data-icon">
                    <FontAwesomeIcon className="icon" icon={faWind} />
                  </div>
                  <div className="data-group">
                    {weatherData.average_wind && (
                      <div className="data-group__row">
                        <p className="label">Average wind</p>
                        <p className="data">{weatherData.average_wind}</p>
                      </div>
                    )}
                    {weatherData.maximum_wind && (
                      <div className="data-group__row">
                        <p className="label">Maximum wind</p>
                        <p className="data">{weatherData.maximum_wind}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>

    // Regional weather html structure
    // <div className="popup popup--regional-weather">
    //   <div className="popup__title">
    //     <div className="popup__title__icon">
    //       <FontAwesomeIcon icon={faSunCloud} />
    //     </div>
    //     <p className="name">Regional Weather</p>
    //   </div>
    //   <div className="popup__advisory">
    //     <FontAwesomeIcon icon={faTriangleExclamation} />
    //     <p className="advisory-title">Arctic outflow warning</p>
    //     <p className="label link"><a alt="Past 24 Hours" target="_blank" rel="noreferrer" href="https://weather.gc.ca/past_conditions/index_e.html?station=yyj">Details</a></p>
    //   </div>
    //   <div className="popup__content">
    //     <div className="popup__content__title">
    //       <p className="name">Cummins Lakes Park</p>
    //       <FriendlyTime date='2024-03-01T00:00:00-08:00' />
    //     </div>
    //     <div className="popup__content__description">
    //       <FontAwesomeIcon className="weather-icon" icon={faSunCloud} />
    //       <p className="weather">Partly cloudy</p>
    //       <p className="temperature">24&#x2103;</p>
    //       <div className="data-card">
    //         <div className="data-card__row">
    //           <div className="data-icon">
    //             <FontAwesomeIcon className="icon" icon={faEye} />
    //           </div>
    //           <p className="label">Visibility</p>
    //          <p className="data">42km</p>
    //        </div>
    //        <div className="data-card__row">
    //           <div className="data-icon">
    //             <FontAwesomeIcon className="icon" icon={faWind} />
    //           </div>
    //           <p className="label">Wind</p>
    //          <p className="data">SW 27 gusts 44 km/h</p>
    //        </div>
    //       </div>
    //     </div>
    //   </div>
    //   <div className="popup__additional">
    //     <p className="label"><a alt="Past 24 Hours" target="_blank" rel="noreferrer" href="https://weather.gc.ca/past_conditions/index_e.html?station=yyj">Past 24 hours</a></p>
    //     <p className="label">Courtesy of <a alt="Environment Canada" target="_blank" rel="noreferrer" href="https://weather.gc.ca/canada_e.html">Environment Canada</a></p>
    //   </div>
    // </div>
  );
}

export function getRestStopPopup(restStopFeature) {
  const restStopData = restStopFeature.getProperties();

  return (
    <div className="popup popup--reststop">
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faRestroom} />
        </div>
        <p className="name">
          Rest area
        </p>
      </div>
      <div className="popup__content">
        <div className="popup__content__description">
          <p>{`${restStopData.properties.REST_AREA_NAME}`}</p>
          <p>{`${restStopData.properties.DISTANCE_FROM_MUNICIPALITY}`}</p>  
          <hr/>
          <div className='popup__content_block'>
            <div className='popup__content__description'>
              <div className='popup__content__description__categary'>Access</div>
              <div className='popup__content__description__container'>
                <div><FontAwesomeIcon icon={faClock} /></div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {restStopData.properties.OPEN_YEAR_ROUND !== "No" ? (
                      "Open year around"
                    ) : (
                      `Open: ${restStopData.properties.OPEN_DATE} - ${restStopData.properties.CLOSE_DATE}`
                    )}
                  </div>
                </div>
              </div>
              <div className='popup__content__description__container'>
                <div><FontAwesomeIcon icon={faDoorOpen} /></div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {`${restStopData.properties.DIRECTION_OF_TRAFFIC} entrance, ${restStopData.properties.ACCESS_RESTRICTION}`}
                  </div>
                </div>
              </div>
              <div className='popup__content__description__container'>
                <div><FontAwesomeIcon icon={faTruckContainer} /></div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {restStopData.properties.ACCOM_COMMERCIAL_TRUCKS === "Yes" ? (
                      "Large vehicles accommodated"
                    ) : (
                      `Large vehicles not accommodated`
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr/>
          <div className='popup__content_block'>
            <div className='popup__content__description'>
              <div className='popup__content__description__categary'>Features</div>
              <div className='popup__content__description__container'>
                <div><FontAwesomeIcon icon={faToilet} /></div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {restStopData.properties.WHEELCHAIR_ACCESS_TOILET === "Yes" ? (
                      `${restStopData.properties.NUMBER_OF_TOILETS} wheelchair accessible toilets`
                    ) : (
                      `${restStopData.properties.NUMBER_OF_TOILETS} toilets (not wheelchair accessible)`
                    )}
                  </div>
                </div>
              </div>
              <div className='popup__content__description__container'>
                <div><FontAwesomeIcon icon={faTablePicnic} /></div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {restStopData.properties.NUMBER_OF_TABLES !== 0 && restStopData.properties.NUMBER_OF_TABLES !== null ? (
                      `${restStopData.properties.NUMBER_OF_TABLES} tables`
                    ) : (
                      `No tables`
                    )}
                  </div>
                </div>
              </div>
              <div className='popup__content__description__container'>
                <div><FontAwesomeIcon icon={faWifi} /></div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {restStopData.properties.WI_FI === "No" ? (
                      `Wi-Fi unavailable`
                    ) : (
                      `Wi-Fi available`
                    )}
                  </div>
                </div>
              </div>
              <div className='popup__content__description__container'>
                <div><FontAwesomeIcon icon={faRoad} /></div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {restStopData.properties.ACCELERATION_LANE === "No" ? (
                      `No acceleration lane, `
                    ) : (
                      `Acceleration lane, `
                    )}
                    {restStopData.properties.DECELERATION_LANE === "No" ? (
                      `no deceleration lane`
                    ) : (
                      `deceleration lane`
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr/>
          <div className='popup__content_block'>
            <div className='popup__content__description'>
              <div className='popup__content__description__categary'>Electiric Vehicles</div>
              <div className='popup__content__description__container'>
                <div><FontAwesomeIcon icon={faChargingStation} /></div>
                <div className='popup__content__description__container__text'>
                  <div>
                  {restStopData.properties.EV_STATION_25_KW_DCFC === 0 
                  && restStopData.properties.EV_STATION_50_KW_DCFC === 0 
                  && restStopData.properties.EV_STATION_LEVEL_2_J1772 === 0? (
                      `No charging stations `
                    ) : (
                      ``
                    )}
                  </div>
                </div>
              </div>
              <div className='popup__content__description__container'>
                <div>
                  {restStopData.properties.EV_STATION_25_KW_DCFC !== 0 && (
                        <FontAwesomeIcon icon={faChargingStation} />
                      )}       
                </div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {restStopData.properties.EV_STATION_25_KW_DCFC !== 0 && (
                      `J1772 6.48KW: ${restStopData.properties.EV_STATION_25_KW_DCFC} `
                    )}
                  </div>
                </div>
              </div>
              <div className='popup__content__description__container'>
                <div>
                  {restStopData.properties.EV_STATION_25_KW_DCFC !== 0 && (
                        <FontAwesomeIcon icon={faChargingStation} />
                      )}       
                </div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {restStopData.properties.EV_STATION_25_KW_DCFC !== 0 && (
                      `CHAdeMO 25KW: ${restStopData.properties.EV_STATION_25_KW_DCFC} `
                    )}
                  </div>
                </div>
              </div>
              <div className='popup__content__description__container'>
                <div>
                  {restStopData.properties.EV_STATION_50_KW_DCFC !== 0 && (
                        <FontAwesomeIcon icon={faChargingStation} />
                      )}       
                </div>
                <div className='popup__content__description__container__text'>
                  <div>
                    {restStopData.properties.EV_STATION_50_KW_DCFC !== 0 && (
                      `CHAdeMO 50KW: ${restStopData.properties.EV_STATION_50_KW_DCFC} `
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
