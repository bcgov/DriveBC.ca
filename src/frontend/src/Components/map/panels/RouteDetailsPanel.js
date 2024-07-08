// React
import React from 'react';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRoad,
  faMinusCircle,
  faFerry
} from '@fortawesome/pro-solid-svg-icons';

// Styling
import './RouteDetailsPanel.scss';

export default function RouteDetailsPanel({routeObjects}) {

  return (
    <div className="popup popup--route" tabIndex={0}>
      <div className="popup__title">
        <p className="name">Your route</p>
      </div>
      {routeObjects && (
        <div className="popup__content">
          <div className="route-card">
            <div className="route-title">
              <span className="route-icon">
                <FontAwesomeIcon icon={faRoad} />
              </span>
              <p className="route-distance">{Math.round(routeObjects.distance)}{routeObjects.distanceUnit}</p>
            </div>
            <div className="route-items">
              {(routeObjects.closures > 0) &&
                <div className="route-item route-item--closures">
                  <span className="route-item__count">
                    {routeObjects.closures}
                  </span>
                  <span className="route-item__icon">
                    <FontAwesomeIcon icon={faMinusCircle} alt="closures" />
                  </span>
                  <span className="route-item__name">Closures</span>
                </div>
              }
              {(routeObjects.majorEvents > 0) &&
                <div className="route-item route-item--major">
                  <span className="route-item__count">
                    {routeObjects.majorEvents}
                  </span>
                  <span className="route-item__icon">
                    <svg width="18" height="19" viewBox="0 0 18 19" fill="currentColor" xmlns="http://www.w3.org/2000/svg" alt="major delays" aria-hidden="true" focusable="false" role="img">
                      <path className="filter-item__icon__path" d="M1.22269 6.84836L6.45493 1.61612C7.89977 0.171277 10.2423 0.171276 11.6872 1.61612L16.9194 6.84836C18.3642 8.2932 18.3642 10.6358 16.9194 12.0806L11.6872 17.3128C10.2423 18.7577 7.89977 18.7577 6.45493 17.3128L1.22269 12.0806C-0.222156 10.6358 -0.222157 8.2932 1.22269 6.84836ZM3.18478 8.81045C2.82357 9.17166 2.82357 9.7573 3.18478 10.1185L8.41702 15.3507C8.77823 15.712 9.36386 15.712 9.72507 15.3507L14.9573 10.1185C15.3185 9.7573 15.3185 9.17166 14.9573 8.81045L9.72507 3.57821C9.36386 3.217 8.77823 3.217 8.41702 3.57821L3.18478 8.81045Z"/>
                    </svg>
                  </span>
                  <span className="route-item__name">Major delays</span>
                </div>
              }
              {(routeObjects.minorEvents > 0) &&
                <div className="route-item route-item--minor">
                  <span className="route-item__count">
                    {routeObjects.minorEvents}
                  </span>
                  <span className="route-item__icon">
                    <svg width="18" height="16" viewBox="0 0 18 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" alt="minor delays" aria-hidden="true" focusable="false" role="img">
                      <path className="filter-item__icon__path" d="M15.501 0H2.50098C0.660978 0 -0.549022 1.65 0.250978 3.08L6.75098 14.77C7.66098 16.4 10.351 16.4 11.261 14.77L17.761 3.08C18.551 1.65 17.341 0 15.501 0ZM15.441 3.03L9.45098 13.81C9.45098 13.81 9.29098 14.01 8.94098 14.01C8.59098 14.01 8.46098 13.85 8.43098 13.81L2.59098 3.26C2.23098 2.61 2.48098 2 3.23098 2H14.961C15.551 2 15.741 2.51 15.451 3.03H15.441Z"/>
                    </svg>
                  </span>
                  <span className="route-item__name">Minor delays</span>
                </div>
              }
              {(routeObjects.roadConditions > 0) &&
                <div className="route-item route-item--roadConditions">
                  <span className="route-item__count">
                    {routeObjects.roadConditions}
                  </span>
                  <span className="route-item__icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" alt="road conditions" aria-hidden="true" focusable="false" role="img">
                      <path className="route-item__icon__path" d="M19.5625 8.8925L11.1125 0.4425C10.4825 -0.1475 9.5125 -0.1475 8.8825 0.4425L0.4425 8.8925C-0.1475 9.5225 -0.1475 10.4925 0.4425 11.1225L8.8925 19.5725C9.5225 20.1625 10.4925 20.1625 11.1225 19.5725L19.5725 11.1225C20.1625 10.4925 20.1625 9.5225 19.5725 8.8925H19.5625ZM8.9425 10.4525L5.5625 13.8325C5.3125 14.0625 4.9225 14.0625 4.6725 13.8325L1.2925 10.4525C1.0625 10.2025 1.0625 9.8125 1.2925 9.5625L4.6725 6.1825C4.9225 5.9525 5.3125 5.9525 5.5625 6.1825L8.9425 9.5625C9.1725 9.8125 9.1725 10.2025 8.9425 10.4525ZM18.7225 10.4525L15.3425 13.8325C15.0925 14.0625 14.7025 14.0625 14.4525 13.8325L11.0725 10.4525C10.8425 10.2025 10.8425 9.8125 11.0725 9.5625L14.4525 6.1825C14.7025 5.9525 15.0925 5.9525 15.3425 6.1825L18.7225 9.5625C18.9525 9.8125 18.9525 10.2025 18.7225 10.4525Z" />
                    </svg>
                  </span>
                  <span className="route-item__name">Road conditions</span>
                </div>
              }
              {(routeObjects.ferries > 0) &&
                <div className="route-item route-item--ferries">
                  <span className="route-item__count">
                    {routeObjects.ferries}
                  </span>
                  <span className="route-item__icon">
                    <FontAwesomeIcon icon={faFerry} alt="inland ferries" />
                  </span>
                  <span className="route-item__name">Inland Ferry</span>
                </div>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
