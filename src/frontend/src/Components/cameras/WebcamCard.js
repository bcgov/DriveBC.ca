import { useNavigate } from "react-router-dom";
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import './WebcamCard.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt
} from "@fortawesome/free-solid-svg-icons";

export default function WebcamCard({ camera }) {
  const navigate = useNavigate();

  function handleClick() {
    navigate("/CameraDetailsPage", { state: camera.id})
  }
  return (
    <Card className="webcam-card">
      <Card.Body onClick={handleClick}>
        <div className="card-img-box">
          <Card.Img variant="top" src={camera.properties.url} />
        </div>
        <p className="label bold">{camera.properties.name}</p>
        <p className="label">{camera.properties.caption}</p>
      </Card.Body>
      <Button variant="primary">View on map<FontAwesomeIcon icon={faMapMarkerAlt
} /></Button>
    </Card>
  )
}
