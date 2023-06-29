import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import './WebcamCard.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { faVideoSlash } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from "react";

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

  // Last updated time
  const datetime_format = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };

  const last_updated_time = new Date(camera.properties.timestamp);
  const last_updated_time_formatted = new Intl.DateTimeFormat("en-US", datetime_format).format(last_updated_time);
  function get_last_update_diff() {
    return Math.trunc((new Date() - last_updated_time) / (1000 * 60));
  }

  const [lastUpdateMin,setLastUpdateMin] = useState(get_last_update_diff());

  useEffect(() => {
    var timer = setInterval(() => setLastUpdateMin(get_last_update_diff()), 60000)
    return function cleanup() {
      clearInterval(timer)
    }
  });

  // Rendering
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
        <div className="timestamp">
          <p className="driveBC">Drive<span>BC</span></p>
          <p className="label">{last_updated_time_formatted}</p>
        </div>
        {/* <p>Last updated {lastUpdateMin.toString()} minutes ago</p> */}
        <p className="label bold">{camera.properties.name}</p>
        <p className="label">{camera.properties.caption}</p>
      </Card.Body>
      <Button variant="primary">View on map<FontAwesomeIcon icon={faMapMarkerAlt} /></Button>
    </Card>
  )
}
