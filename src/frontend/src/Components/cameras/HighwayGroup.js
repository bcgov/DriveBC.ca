// React
import React, { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Components and functions
import CameraCard from './CameraCard.js';
import highwayShield from './highwayShield';

export default function HighwayGroup(props) {
  // Props
  const { highway, cams, showLoader} = props;
  const focusedButtonRef = useRef(null);
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.includes("my-camera") && focusedButtonRef.current) {
      focusedButtonRef.current.focus();
    }
  }, [cams, location.pathname]);

  return (
    <div className="highway-group">
      <div className="highway-title">
        {!isNaN(highway.charAt(0)) &&
          <div className="highway-shield-box">
            {highwayShield(highway)}
          </div>
        }

        <div className="highway-name">
          <p className="highway-name__number">{!isNaN(highway.charAt(0)) ? 'Highway' : ''} {highway}</p>
          {highway === '1' &&
            <h2 className="highway-name__alias highway-name__alias--green">Trans Canada</h2>
          }
          {highway !== '1' &&
            <h2 className="highway-name__alias">{!isNaN(highway.charAt(0)) ? 'Highway' : ''} {highway}</h2>
          }
        </div>
      </div>

      <div className="webcam-group">
        {cams.map((cam, id) => (
          <CameraCard cameraData={cam} className="webcam" key={id} showLoader={showLoader} 
            setFocusedButtonRef={(el) => {
              if (id === cams.length - 1) {
                focusedButtonRef.current = el;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
