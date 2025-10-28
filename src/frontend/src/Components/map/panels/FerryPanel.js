// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXTwitter,
  faFacebookF,
} from '@fortawesome/free-brands-svg-icons';
import {
  faCar,
  faClock,
  faEnvelope,
  faFax,
  faPersonWalkingLuggage,
  faPhone,
  faWeightScale,
} from '@fortawesome/pro-regular-svg-icons';
import { useMediaQuery } from "@uidotdev/usehooks";
import parse from 'html-react-parser';

// Internal imports
import { formatDate } from "../../shared/FriendlyTime";
import ShareURLButton from '../../shared/ShareURLButton';

// Styling
import './FerryPanel.scss';

export default function FerryPanel(props) {
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

  // Helpers
  const formatPhoneNumber = (phoneNumber) => {
    // Remove any non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // Check if the number has 10 or 11 digits
    if (digits.length === 10) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;

    } else if (digits.length === 11 && digits[0] === '1') {
      return `${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }

    // Return the original number if it doesn't match the expected format
    return phoneNumber;
  }

  // Rendering
  // Sub components
  const SocialURL = ({ url }) => {
    if (!url) return;

    // Facebook
    const fbRegex = /facebook\.com\/(?:profile\.php\?id=|(?:\w+\/)*)([\w.]+)/;
    const fbMatch = url.match(fbRegex);
    if (fbMatch) {
      return (
        <div className='info__row'>
          <p><FontAwesomeIcon icon={faFacebookF}/> Facebook</p>
          <p>/{fbMatch[1]}</p>
        </div>
      );
    }

    // Twitter
    const twitterRegex = /(?:twitter\.com|x\.com)\/([\w.]+)/;
    const twitterMatch = url.match(twitterRegex);
    if (twitterMatch) {
      return (
        <div className='info__row'>
          <p><FontAwesomeIcon icon={faXTwitter}/> X</p>
          <p>@{twitterMatch[1]}</p>
        </div>
      );
    }
  }

  // Main component
  return (
    <div className="popup popup--ferry" tabIndex={0}>
      <div className={`popup__title ${showRouteObjs && !smallScreen ? 'from-route-objs' : ''}`}>
        <div className="popup__title__name">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="22" height="22" rx="3" fill="white"/>
            <rect x="1" y="1" width="22" height="22" rx="3" stroke="#448C47" strokeWidth="2"/>
            <path d="M10.25 5.5H13.25C13.6484 5.5 14 5.85156 14 6.25H15.7578C16.2266 6.25 16.4844 6.83594 16.1797 7.1875L15.6875 7.75H7.8125L7.29688 7.1875C6.99219 6.83594 7.25 6.25 7.71875 6.25H9.5C9.5 5.85156 9.82812 5.5 10.25 5.5ZM7.25 8.5H16.25C16.6484 8.5 17 8.85156 17 9.25V12.1562C17 12.4609 16.8828 12.7656 16.7188 13.0234L15.5 14.7109C15.4531 14.7344 15.4297 14.7578 15.3828 14.8047C15.0078 15.0391 14.5859 15.2266 14.1875 15.25H13.7891C13.3906 15.2266 12.9688 15.0391 12.5938 14.8047C12.0781 14.4297 11.3984 14.4297 10.8828 14.8047C10.5312 15.0391 10.1094 15.2266 9.6875 15.25H9.3125C8.91406 15.2266 8.46875 15.0391 8.11719 14.8047C8.07031 14.7578 8.02344 14.7344 7.97656 14.7109L6.75781 13.0234C6.59375 12.7656 6.5 12.4609 6.5 12.1562V9.25C6.5 8.85156 6.82812 8.5 7.25 8.5ZM8 10V12.25H15.5V10H8ZM12.1719 15.3906C12.7109 15.7656 13.3438 16 14 16C14.6094 16 15.2891 15.7656 15.8047 15.3906C16.0859 15.2031 16.4609 15.2266 16.7188 15.4375C17.0703 15.7188 17.4922 15.9297 17.9141 16.0234C18.3125 16.1172 18.5703 16.5156 18.4766 16.9375C18.3828 17.3359 17.9609 17.5938 17.5625 17.5C17 17.3594 16.5078 17.1016 16.2031 16.9141C15.5234 17.2656 14.7734 17.5 14 17.5C13.25 17.5 12.5703 17.2891 12.1016 17.0781C11.9609 17.0078 11.8438 16.9375 11.75 16.8906C11.6328 16.9375 11.5156 17.0078 11.375 17.0781C10.9062 17.2891 10.2266 17.5 9.5 17.5C8.72656 17.5 7.95312 17.2656 7.27344 16.9141C6.96875 17.1016 6.47656 17.3594 5.91406 17.5C5.51562 17.5938 5.09375 17.3359 5 16.9375C4.90625 16.5391 5.16406 16.1172 5.5625 16.0234C5.98438 15.9297 6.42969 15.7188 6.75781 15.4375C7.01562 15.2266 7.39062 15.2031 7.67188 15.3906C8.1875 15.7656 8.86719 16 9.5 16C10.1328 16 10.7891 15.7656 11.3047 15.3906C11.5625 15.2031 11.9141 15.2031 12.1719 15.3906Z" fill="#448C47"/>
          </svg>
          <p className='name'>Inland ferry</p>
        </div>
        <ShareURLButton/>
      </div>

      <div className="popup__content">
        <div className="popup__content__container">
        <div className="popup__content__title">
            <p className='name'><a
            href={ferryData.url}
            rel="noreferrer">{`${ferryData.route_name}`}</a></p>
            <div className="popup__title__updated">
              Updated {formatDate(ferryData.feed_modified_at)}
            </div>
          </div>
        </div>

        <div className="info">
          {ferryData.vessels && ferryData.vessels.map((vessel, index) => (
            <div className='info__block' key={index}>
              <div className='info__container'>
                <p className='info__header'>Ferry details</p>

                <div className="data-card">
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon icon={faCar}/>
                    </div>
                    <p className="label">Vehicle capacity</p>
                    <p className="data">{vessel.vehicle_capacity ? `${vessel.vehicle_capacity}` : 'N/A'}
                    </p>
                  </div>
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon icon={faPersonWalkingLuggage}/>
                    </div>
                    <p className="label">Passengers</p>
                    <p className="data">{vessel.passenger_capacity ? `${vessel.passenger_capacity}` : 'N/A'}
                    </p>
                  </div>
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon icon={faClock}/>
                    </div>
                    <p className="label">Trip time</p>
                    <p className="data">{vessel.crossing_time_min ? `${vessel.crossing_time_min} minutes` : 'N/A'}
                    </p>
                  </div>
                  <div className="data-card__row">
                    <div className="data-icon">
                      <FontAwesomeIcon icon={faWeightScale}/>
                    </div>
                    <p className="label">Weight limit</p>
                    <p className="data">{vessel.weight_capacity_kg ? `${vessel.weight_capacity_kg}kg` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {ferryData.image_url && (
                <div className="popup__content__image">
                  <img src={ferryData.image_url} alt={`${ferryData.route_name} vessel`} />
                </div>
              )}

              <div className='info__container'>
                {vessel.schedule_detail &&
                  <p>{parse(vessel.schedule_detail)}</p>
                }

                {vessel.special_restriction &&
                  <p>{vessel.special_restriction}</p>
                }
              </div>
              
              <hr />
            </div>

          ))}

          <div className='info__container'>
            <p className='info__header'>Description</p>

            {ferryData.route_image_url && (
              <div className="popup__content__image info__map">
                <img src={ferryData.route_image_url} alt={`${ferryData.route_name} map`}/>
              </div>
            )}

            <p>{ferryData.route_description}</p>
          </div>

          <div className='info__container'>
            <p className='info__header'>Contact information</p>

            <p>{ferryData.contact_org}</p>

            {ferryData.contact_phone &&
              <div className='info__row'>
                <p><FontAwesomeIcon icon={faPhone}/> Phone</p>
                <a href={"tel:" + formatPhoneNumber(ferryData.contact_phone)}>{formatPhoneNumber(ferryData.contact_phone)}</a>
              </div>
            }

            {ferryData.contact_alt_phone &&
              <div className='info__row'>
                <p><FontAwesomeIcon icon={faPhone}/> {ferryData.contact_phone ? 'Alt phone' : 'Phone'}</p>
                <a href={"tel:" + formatPhoneNumber(ferryData.contact_alt_phone)}>{formatPhoneNumber(ferryData.contact_alt_phone)}</a>
              </div>
            }

            {ferryData.contact_fax &&
              <div className='info__row'>
                <p><FontAwesomeIcon icon={faFax}/> Fax</p>
                <p>{formatPhoneNumber(ferryData.contact_fax)}</p>
              </div>
            }

            {ferryData.contact_email &&
              <div className='info__row'>
                <p><FontAwesomeIcon icon={faEnvelope}/> Email</p>
                <a href={"mailto:" + ferryData.contact_email}>{ferryData.contact_email}</a>
              </div>
            }

            <SocialURL url={ferryData.contact_url_1}/>

            <SocialURL url={ferryData.contact_url_2}/>
          </div>
        </div>
      </div>
    </div>
  );
}
