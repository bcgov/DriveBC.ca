// React
import React from 'react';

// Third party packages
import Container from 'react-bootstrap/Container';

// Components and functions
import CameraCard from './CameraCard.js';
import highwayShield from '../highwayShield.js';

export default function HighwayGroup(props) {
  // Props
  const { highway, cams } = props;

  return (
    <div className="highway-group">
      <Container>
        <div className="highway-title">
          <div className="highway-shield-box">
            {highwayShield(highway)}
          </div>

          <div className="highway-name">
            <p className="highway-name__number">Highway {highway}</p>
            {highway === '1' &&
              <h2 className="highway-name__alias highway-name__alias--green">Trans Canada</h2>
            }
            {highway !== '1' &&
              <h2 className="highway-name__alias">Highway {highway}</h2>
            }
          </div>
        </div>

        <div className="webcam-group">
          {cams.map((cam, id) => (
            <CameraCard cameraData={cam} className="webcam" key={id} />
          ))}
        </div>
      </Container>
    </div>
  );
}
