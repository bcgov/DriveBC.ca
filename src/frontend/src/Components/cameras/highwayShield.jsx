// React
import React from 'react';

// External imports
import Skeleton from "react-loading-skeleton";

// Static files
import BCHwyCrest from '../../images/BCHwyCrest.svg';
import BCHwyCrest1 from '../../images/BCHwyCrest1.svg';
import BCHwyCrest3 from '../../images/BCHwyCrest3.svg';
import BCHwyCrest5 from '../../images/BCHwyCrest5.svg';
import BCHwyCrest16 from '../../images/BCHwyCrest16.svg';

const getCrest = (highway) => {
  switch (highway) {
    case '1':
      return BCHwyCrest1;
    case '3':
      return BCHwyCrest3;
    case '5':
      return BCHwyCrest5;
    case '16':
      return BCHwyCrest16;
    default:
      return BCHwyCrest;
  }
}

export default function highwayShield(highway) {
  let highwaySplit = highway.match(/[a-zA-Z]/);
  if (highwaySplit !== null) {
    highwaySplit = highwaySplit[0];
  }
  return highway === 'loading' ? <Skeleton width={30} height={40} /> : (
    <div className="highway-shield">
      { ['1', '3', '5', '16'].indexOf(highway) < 0 &&
        <p className="highway-shield__number">
            <span>{highway.replace(highwaySplit, "")}</span>
            { highwaySplit !== null &&
              <sup>{highwaySplit}</sup>
            }
        </p>
      }

      <img src={getCrest(highway)} alt={"highway " + highway}/>
    </div>
  );
}
