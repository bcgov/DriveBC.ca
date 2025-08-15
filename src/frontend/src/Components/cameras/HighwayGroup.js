// React
import React from 'react';

// External imports
import Skeleton from "react-loading-skeleton";

// Internal imports
import CameraCard from './CameraCard.js';
import highwayShield from './highwayShield';

export default function HighwayGroup(props) {
  // Props
  const { highway, cams, showLoader } = props;

  return (
    <div className="highway-group">
      <div className="highway-title">
        {(!isNaN(highway.charAt(0)) || highway === 'loading') &&
          <div className="highway-shield-box">
            {highwayShield(highway)}
          </div>
        }

        <div className="highway-name">
          {/* Highway badge */}
          {highway === 'loading' &&
            <Skeleton width={120} height={15}/>
          }

          {highway !== 'loading' &&
            <p className="highway-name__number">{!isNaN(highway.charAt(0)) ? 'Highway' : ''} {highway}</p>
          }

          {/* Highway name and alias */}
          {highway === 'loading' &&
            <Skeleton width={215} height={30} />
          }

          {highway === '1' &&
            <h2 className="highway-name__alias highway-name__alias--green">Trans Canada</h2>
          }

          {highway !== '1' && highway !== 'loading' &&
            <h2 className="highway-name__alias">{!isNaN(highway.charAt(0)) ? 'Highway' : ''} {highway}</h2>
          }
        </div>
      </div>

      <div className="webcam-group">
        {cams.map((cam, id) => (
          <CameraCard cameraData={cam} className="webcam" key={id} showLoader={showLoader}/>
        ))}
      </div>
    </div>
  );
}
