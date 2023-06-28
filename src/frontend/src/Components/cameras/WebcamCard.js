import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import './WebcamCard.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { faVideoSlash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

export default function WebcamCard({ camera }) {
  const stale = camera.properties.marked_stale ? "stale" : "";
  const delayed = camera.properties.marked_delayed ? "delayed" : "";
  const unavailable = camera.properties.is_on ? "" : "unavailable";
  const [show, setShow] = useState(false)
  const navigate = useNavigate();

  function handleClick() {
    navigate("/CameraDetailsPage", { state: camera.id})
  }

  function handleChildClick(e) {
    e.stopPropagation();
    setShow(!show);
  }
  return (
    <Card className={`webcam-card ${stale} ${delayed} ${unavailable}`}>
      <Card.Body onClick={handleClick}>
        <div className="card-img-box">
        {!unavailable &&
          <Card.Img variant="top" src={camera.properties.url} />
        }

        {!unavailable && delayed &&
          <div className="card-notification">
            <div className={"card-banner " + (show ? "hidden" : "bounce") }>
              <p>Longer than expected delay, displaying last image received.</p>
              <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
            </div>
            <div className={"card-pill " + (show ? "bounce" : "hidden") }  onClick={handleChildClick} >
              <p>Delayed</p>
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>
          </div>
        }

        {!unavailable && !delayed && stale &&
          <div className="card-notification">
            <div className={"card-banner " + (show ? "hidden" : "bounce") }>
              <p>Unable to retrieve latest image. Showing last image received.</p>
              <FontAwesomeIcon icon={faXmark} onClick={handleChildClick} />
            </div>
            <div className={"card-pill " + (show ? "bounce" : "hidden") }  onClick={handleChildClick} >
              <p>Stale</p>
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>
          </div>
        }

        {unavailable &&
          <div className="card-notification">
            <div className="card-pill">
              <p>Unavailable</p>
            </div>
          </div>
        }

        {unavailable &&
        <div className="unavailable-message">
          <FontAwesomeIcon icon={faVideoSlash} />
          <p>This traffic camera image is temporarily unavailable. Please check again later.</p>
        </div>
        }
        </div>
        <p className="label bold">{camera.properties.name}</p>
        <p className="label">{camera.properties.caption}</p>
        <p className="label bold">{camera.properties.timestamp}</p>
      </Card.Body>
      <Button variant="primary">View on map<FontAwesomeIcon icon={faMapMarkerAlt} /></Button>
    </Card>
  )
}
