// React
import React from 'react';
import restStopIconActive from '../images/mapIcons/restarea-open-active.png';
import restStopIconActiveClosed from '../images/mapIcons/restarea-closed-active.png';
import restStopIconActiveTruck from '../images/mapIcons/restarea-truck-open-active.png';
import restStopIconActiveTruckClosed from '../images/mapIcons/restarea-truck-closed-active.png';
import { isRestStopClosed } from './data/restStops';

export default function RestStopTypeIcon(props) {
  const { reststop } = props;
  const isRestStopOpenYearAround = reststop.properties.OPEN_YEAR_ROUND === "Yes"? true: false;
  const isLargeVehiclesAccommodated = reststop.properties.ACCOM_COMMERCIAL_TRUCKS === "Yes"? true: false;

  if (isRestStopOpenYearAround ){
    if(isLargeVehiclesAccommodated){
      return <img className={'rest_stop_-icon-img'} src={restStopIconActiveTruck } />
    } else {
      return <img className={'rest_stop_-icon-img'} src={restStopIconActive } />
    }   
  } else {
    const isClosed = isRestStopClosed(reststop.properties);

    if(isClosed){
      if(isLargeVehiclesAccommodated){
        return <img className={'rest_stop_-icon-img'} src={restStopIconActiveTruckClosed } />

      } else {
        return <img className={'rest_stop_-icon-img'} src={restStopIconActiveClosed } />
      }

    }
    else{
      if(isLargeVehiclesAccommodated){
        return <img className={'rest_stop_-icon-img'} src={restStopIconActiveTruck } />

      } else {
        return <img className={'rest_stop_-icon-img'} src={restStopIconActive } />
      }
    }

  }        
}