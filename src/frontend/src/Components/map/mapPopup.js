// React
import React from 'react';

// Third party packages
import EventTypeIcon from '../EventTypeIcon';
import RestStopTypeIcon from '../RestStopTypeIcon';
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
  faCircleInfo,
  faTablePicnic,
  faTruckContainer,
  faSunCloud
} from '@fortawesome/pro-solid-svg-icons';

import './mapPopup.scss';

import WeatherIcon from '../WeatherIcon';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import OpenSeason from '../OpenSeason';
import { isRestStopClosed } from '../data/restStops';

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

const tooltipLargeVehicles = (
  <Tooltip id="tooltip" className="tooltip-content">
    <p>A large vehicle is defined as one larger than 10 metres &#40;32 feet&#41; in length.</p>
  </Tooltip>
);

export function getEventPopup(eventFeature) {
  const eventData = eventFeature.ol_uid
    ? eventFeature.getProperties()
    : eventFeature;
  const severity = eventData.severity.toLowerCase();

  return (
    <div
      className={`popup popup--event ${eventData.display_category} ${severity}`} tabIndex={0}>
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
          <div className="popup__content__description last-update">
            <p>Last update</p>
            <FriendlyTime date={eventData.last_updated} />
          </div>

          {eventData.next_update &&
            <div className="popup__content__description next-update">
              <p>Next update</p>
              <FriendlyTime date={eventData.next_update} />
            </div>
          }
        </div>

        <div className="popup__content__description debug-data">
          {eventData.id}
        </div>
      </div>
    </div>
  );
}

export function getFerryPopup(ferryFeature) {
  const ferryData = ferryFeature.getProperties();

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


export function getWeatherPopup(weatherFeature) {
  const weatherData = weatherFeature.getProperties();

  return (
    <div className="popup popup--road-weather" tabIndex={0}>
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
  );
}


export function getRegionalPopup(weatherFeature) {
  const weather = weatherFeature.getProperties();
  const conditions = weather.conditions;

  return (
    <div className="popup popup--regional-weather" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faSunCloud} />
        </div>
        <p className="name">Regional Weather</p>
      </div>
      { weather.warnings &&
        <div className="popup__advisory">
          { weather.warnings.Events.map(event => {
            return <div key={ event.expirytime } className="event">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <p className="advisory-title">{ event.Description }</p>
            </div>;
          })}

          <p className="label link">
            <a
              alt="Past 24 Hours"
              target="_blank"
              rel="noreferrer"
              href={ weather.warnings.Url }
            >Details</a></p>
        </div>
      }
      <div className="popup__content">
        <div className="popup__content__title">
          <p className="name">{weather.name}</p>
          { weather.observed && <FriendlyTime date={weather.observed} asDate={true} /> }
        </div>
        <div className="popup__content__description">
          <WeatherIcon className="weather-icon" code={conditions.icon_code} />
          <p className="weather">{ conditions.condition }</p>

          { conditions.temperature_units &&
            <p className="temperature">
              { Math.round(conditions.temperature_value) }
              { conditions.temperature_units }
            </p>
          }

          { (conditions.visibility_value || conditions.wind_speed_value) && (
            <div className="data-card">
              { conditions.visibility_value && (
                <div className="data-card__row">
                  <div className="data-icon">
                    <FontAwesomeIcon className="icon" icon={faEye} />
                  </div>
                  <p className="label">Visibility</p>
                  <p className="data">
                    {Math.round(conditions.visibility_value)}
                    {conditions.visibility_units}
                  </p>
                </div>
              )}

              { conditions.wind_speed_value &&
                <div className="data-card__row">
                  <div className="data-icon">
                    <FontAwesomeIcon className="icon" icon={faWind} />
                  </div>
                  <p className="label">Wind</p>
                  <p className="data">&nbsp;
                    { conditions.wind_speed_value === "calm" ?
                      <span>calm</span> :
                      <span>
                        { Math.round(conditions.wind_speed_value) }
                        { conditions.wind_speed_units }
                        { conditions.wind_gust_value && (
                          <span>&nbsp;gusts
                            {Math.round(conditions.wind_gust_value)}
                            &nbsp;{conditions.wind_gust_units}
                          </span>
                        )}
                      </span>
                    }
                  </p>
                </div>
              }
            </div>
          )}

        </div>
      </div>
      <div className="popup__additional">
        { weather.station &&
          <p className="label">
            <a
              alt="Past 24 Hours"
              target="_blank"
              rel="noreferrer"
              href={`https://weather.gc.ca/past_conditions/index_e.html?station=${weather.station}`}
            >Past 24 hours</a>
          </p>
        }
        <p className="label">
          Courtesy of &nbsp;
          <a
            alt="Environment Canada"
            target="_blank"
            rel="noreferrer"
            href="https://weather.gc.ca/canada_e.html"
          >Environment Canada</a></p>
      </div>
    </div>
  );
}

export function getRestStopPopup(restStopFeature) {
  const restStopData = restStopFeature.getProperties();

  return (
    <div className="popup popup--reststop" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <RestStopTypeIcon reststop={restStopData} state="active" />
        </div>
        <p className="name">Rest area</p>
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
                <p className="green-text">Open year around</p>
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
            <div className='popup__content__description__container__row'>
              <FontAwesomeIcon icon={faTruckContainer} />
              {restStopData.properties.ACCOM_COMMERCIAL_TRUCKS === "Yes" ? (
                  <p>Large vehicles accommodated</p>
                ) : (
                  <p className="red-text">Large vehicles not accommodated</p>
              )}
              <OverlayTrigger placement="top" overlay={tooltipLargeVehicles}>
              <FontAwesomeIcon className="tooltip-vehicles" icon={faCircleInfo} />
              </OverlayTrigger>
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
          <p className="description-label label">Electric Vehicles</p>

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
