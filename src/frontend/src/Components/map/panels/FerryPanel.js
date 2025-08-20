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
  faFerry,
  faCar,
  faClock,
  faEnvelope,
  faFax,
  faPersonWalkingLuggage,
  faPhone,
  faWeightScale,
} from '@fortawesome/pro-solid-svg-icons';
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
    setSearchParams(searchParams);
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
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFerry}/>
        </div>

        <div className="popup__title__name">
          <p className='name'><a
            href={ferryData.url}
            rel="noreferrer">{`${ferryData.route_name}`}</a>
          </p>
          <ShareURLButton/>
        </div>

        <div className="popup__title__updated">
          Updated {formatDate(ferryData.feed_modified_at)}
        </div>
      </div>

      <div className="popup__content">
        {ferryData.image_url && (
          <div className="popup__content__image">
            <img src={ferryData.image_url} alt={`${ferryData.route_name} vessel`} />
          </div>
        )}

        <div className="info">
          {ferryData.vessels && ferryData.vessels.map((vessel, index) => (
            <div className='info__block' key={index}>
              <div className='info__container'>
                {vessel.schedule_detail &&
                  <p>{parse(vessel.schedule_detail)}</p>
                }

                {vessel.special_restriction &&
                  <p>{vessel.special_restriction}</p>
                }
              </div>

              <div className='info__container'>
                <p className='info__header'>Ferry details</p>

                <div className='info__row'>
                  <p>
                    <FontAwesomeIcon icon={faCar}/>
                    {vessel.vehicle_capacity ? `${vessel.vehicle_capacity} vehicles` : 'N/A'}
                  </p>

                  <p>
                    <FontAwesomeIcon icon={faPersonWalkingLuggage}/>
                    {vessel.passenger_capacity ? `${vessel.passenger_capacity} passengers` : 'N/A'}
                  </p>
                </div>

                <div className='info__row'>
                  <p>
                    <FontAwesomeIcon icon={faClock}/>
                    {vessel.crossing_time_min ? `${vessel.crossing_time_min} minutes` : 'N/A'}
                  </p>

                  <p>
                    <FontAwesomeIcon icon={faWeightScale}/>
                    {vessel.weight_capacity_kg ? `${vessel.weight_capacity_kg}kg` : 'N/A'}
                  </p>
                </div>
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
