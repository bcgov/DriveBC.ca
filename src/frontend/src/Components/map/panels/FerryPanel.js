// React
import React, { useEffect } from 'react';

// Navigation
import { useSearchParams } from 'react-router-dom';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFerry } from '@fortawesome/pro-solid-svg-icons';
import parse from 'html-react-parser';

// Internal imports
import ShareURLButton from '../../shared/ShareURLButton';

// Styling
import './FerryPanel.scss';

export default function FerryPanel(props) {
  const { feature } = props;

  const ferryData = feature.getProperties();

  const [_searchParams, setSearchParams] = useSearchParams();

  // useEffect hooks
  useEffect(() => {
    setSearchParams(new URLSearchParams({ type: 'ferry', id: ferryData.id }));
  }, [feature]);

  console.log(ferryData);

  return (
    <div className="popup popup--ferry" tabIndex={0}>
      <div className="popup__title">
        <div className="popup__title__icon">
          <FontAwesomeIcon icon={faFerry} />
        </div>

        <div className="popup__title__name">
          <p className='name'><a
            href={ferryData.url}
            target="_blank"
            rel="noreferrer">{`${ferryData.route_name}`}</a>
          </p>

          <ShareURLButton />
        </div>
      </div>

      <div className="popup__content">
        {ferryData.image_url && (
          <div className="popup__content__image">
            <img src={ferryData.image_url} alt={ferryData.route_name} />
          </div>
        )}

        <div className="popup__content__description">
          {ferryData.vessels && ferryData.vessels.map((vessel, index) => (
            <div key={index}>
              {vessel.schedule_detail &&
                <p>{parse(vessel.schedule_detail)}</p>
              }

              {vessel.vehicle_capacity &&
                <p><b>Vehicle capacity:</b> {vessel.vehicle_capacity} vehicles</p>
              }

              {vessel.passenger_capacity &&
                <p><b>Passenger capacity:</b> {vessel.passenger_capacity} passengers</p>
              }

              {vessel.crossing_time_min &&
                <p><b>Crossing time:</b> {vessel.crossing_time_min} minutes</p>
              }

              {vessel.weight_capacity_kg &&
                <p><b>Weight capacity:</b> {vessel.weight_capacity_kg}kg</p>
              }

              {vessel.schedule_type &&
                <p><b>Schedule type:</b> {vessel.schedule_type}</p>
              }

              {vessel.special_restriction &&
                <p><b>Special restriction:</b> {vessel.special_restriction}</p>
              }

              <hr/>
            </div>
          ))}

          <p><b>Description</b></p>

          {ferryData.route_image_url && (
            <div className="popup__content__image">
              <img src={ferryData.route_image_url} alt={ferryData.route_name}/>
            </div>
          )}

          <p>{ferryData.route_description}</p>
          <a href={ferryData.url}>View ferry details</a>

          <hr/>

          {ferryData.contact_org &&
            <div>
              {ferryData.contact_phone &&
                <p><b>Contact phone:</b> {ferryData.contact_phone}</p>
              }
              {ferryData.contact_alt_phone &&
                <p><b>Contact alt phone:</b> {ferryData.contact_alt_phone}</p>
              }
              {ferryData.contact_fax &&
                <p><b>Contact fax:</b> {ferryData.contact_fax}</p>
              }
            </div>
          }
        </div>
      </div>
    </div>
  );
}
