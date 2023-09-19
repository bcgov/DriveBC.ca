// React
import React from 'react';
import {useNavigate} from 'react-router-dom';

// Third party packages
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMapMarkerAlt} from '@fortawesome/free-solid-svg-icons';
import {faXmark} from '@fortawesome/free-solid-svg-icons';
import {faCircleInfo} from '@fortawesome/free-solid-svg-icons';
import {faVideoSlash} from '@fortawesome/free-solid-svg-icons';
import {useEffect, useState} from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import FriendlyTime from '../FriendlyTime';

// Styling
import './WebcamCard.scss';

export default function WebcamCard({camera}) {
  const stale = camera.marked_stale ? 'stale' : '';
  const delayed = camera.marked_delayed ? 'delayed' : '';
  const unavailable = camera.is_on ? '' : 'unavailable';
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/cameras/${camera.id}`);
  }

  function handleChildClick(e) {
    e.stopPropagation();
    setShow(!show);
  }

  const lastUpdatedTime = new Date(camera.last_update_modified);

  function getLastUpdateDiff() {
    return Math.trunc((new Date() - lastUpdatedTime) / (1000 * 60));
  }

  const [, setLastUpdateMin] = useState(getLastUpdateDiff());

  useEffect(() => {
    const timer = setInterval(() => setLastUpdateMin(getLastUpdateDiff()), 60000);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  // Rendering
  return (
    <Card className={`webcam-card ${stale} ${delayed} ${unavailable}`}>
      <Card.Body onClick={handleClick}>
        {!unavailable && !delayed && !stale &&
          <div className="card-img-box">
            <img className="card-img" src={ camera.links.imageSource } alt="card_image" />
          </div>
        }

        {!unavailable && stale && !delayed &&
          <div className="card-img-box">
            <img className="card-img" src={ camera.links.imageSource } alt="stale_image"/>
            <div className="card-notification">
              <div className={'card-banner' + (show ? ' hidden' : ' bounce') }>
                <p>Unable to retrieve latest image. Showing last image received.</p>
                <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
              </div>
              <div className={'card-pill' + (show ? ' bounce' : ' hidden') } onClick={handleChildClick} >
                <p>Stale</p>
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>
            </div>
          </div>
        }

        {!unavailable && stale && delayed &&
          <div className="card-img-box">
            <img className="card-img" src={ camera.links.imageSource } alt="delayed_image" />
            <div className="card-notification">
              <div className={'card-banner' + (show ? ' hidden' : ' bounce') }>
                <p>Longer than expected delay, displaying last image received.</p>
                <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
              </div>
              <div className={'card-pill' + (show ? ' bounce' : ' hidden') } onClick={handleChildClick} >
                <p>Delayed</p>
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>
            </div>
          </div>
        }

        {unavailable &&
          <div className="card-img-box">
            <div className="card-notification">
              <div className="card-pill">
                <p>Unavailable</p>
              </div>
            </div>
            <div className="unavailable-message">
              <FontAwesomeIcon icon={faVideoSlash} />
              <p>This traffic camera image is temporarily unavailable. Please check again later.</p>
            </div>
          </div>
        }
        <div className="timestamp">
          <p className="driveBC">Drive<span>BC</span></p>
          <p className="label"><FriendlyTime date={camera.last_update_modified} /></p>
        </div>
        <p className="label bold">{camera.name}</p>
        <p className="label">{camera.caption}</p>
      </Card.Body>
      <Button variant="primary" className="viewmap-btn">View on map<FontAwesomeIcon icon={faMapMarkerAlt} /></Button>
    </Card>
  );
}
