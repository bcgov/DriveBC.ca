// React
import React from 'react';

// import { useDispatch } from 'react-redux'

// Static files
import videoIcon from '../../assets/video-solid.png';
import eventIcon from '../../assets/exclamation-triangle-solid.png';

// Styling
import './RouteDetails.scss';
import styled from 'styled-components'; 

// import { toggleIsRouteDetailsVisible } from '../../slices/routesSlice';

const RouteDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ScrollableContainer = styled.div`
  max-height: 370px; /* Adjust the maximum height as needed */
  overflow-y: auto;

  @media (max-width: 768px) {
    /* Styles for small screens */
    max-height: 100vh; /* Adjust the maximum height for full-screen on small screens */
    top: 60px;
  }
`;

function calculateDistance(point1, point2) {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  const earthRadius = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  return distance;
}

function calculateMBR(coordinates) {
  if (coordinates.length === 0) {
    return null;
  }

  let minX = coordinates[0][0];
  let minY = coordinates[0][1];
  let maxX = coordinates[0][0];
  let maxY = coordinates[0][1];

  for (let i = 1; i < coordinates.length; i++) {
    const x = coordinates[i][0];
    const y = coordinates[i][1];

    if (x < minX) {
      minX = x;
    }
    if (x > maxX) {
      maxX = x;
    }
    if (y < minY) {
      minY = y;
    }
    if (y > maxY) {
      maxY = y;
    }
  }

  return {
    minX: minX,
    minY: minY,
    maxX: maxX,
    maxY: maxY,
  };
}

function isPointWithinMBR(point, mbr) {
  if (!mbr) {
    return false;
  }

  const { minX, minY, maxX, maxY } = mbr;
  const [x, y] = point;

  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

function findEventContainingPoint(point, events) {
  for (let i = 0; i < events.length; i++) {
    const eventLocation = events[i].location.coordinates;
    const mbr = calculateMBR(eventLocation);
    if (isPointWithinMBR(point, mbr)) {
      return i; // Return the index of the event containing the point
    }
  }
  return -1; // Return -1 if the point is not within any event MBR
}

function findCamerasWithinDistance(cameras, currentPoint, maxDistance) {
  const nearbyCameras = [];

  for (let i = 0; i < cameras.length; i++) {
    const camera = cameras[i];
    const cameraLocation = camera.location.coordinates;
    const distance = calculateDistance(currentPoint, cameraLocation);

    if (distance <= maxDistance) {
      nearbyCameras.push(i); // Store the index of the camera within a range
    }
  }

  return nearbyCameras;
}

function listCamerasByIndices(cameras, indices) {
  const nearbyCameras = [];

  for (const index of indices) {
    if (index >= 0 && index < cameras.length) {
      nearbyCameras.push(cameras[index]);
    }
  }

  return nearbyCameras;
}


export default function RouteDetails({events, cameras, directions, handleBack}) {

  // const dispatch = useDispatch();
  // const isRouteDetailsVisible = useSelector((state) => state.routes.isRouteDetailsVisible);

  if (!directions || directions.length === 0) {
    return null;
  }

  const directionElements = directions.map((direction, index) => {
    if (direction.type === 'START') {
      return <div key={'from'-index}>From: {direction.name}</div>;
    } else {
      if(index === directions.length - 2) {
        return <div key={'to-1'-index}>To: {direction.name}</div>
      } else if((index === directions.length - 1)) {
        // pass
      }
      else {
        return <div key={'via'-index}>Via: {direction.name}</div>;
      }      
    }
  });

  const totalDirectionTime = directions.reduce((total, direction) => {
    if (!isNaN(direction.time)) {
      return total + direction.time;
    }
    return total;
  }, 0);

  const totalHours = Math.floor(totalDirectionTime / 3600);
  const totalMinutes = Math.floor((totalDirectionTime % 3600) / 60);
  const totalDistance = directions.reduce((total, direction) => {
    if (!isNaN(direction.distance)) {
      return total + direction.distance;
    }
    return total;
  }, 0);

  const roundedTotalDistance = Math.floor(totalDistance);
  const textElements = directions.map((direction, index) => {

    // To calculate if the point of current direction is in any of the events
    let isPointWinthinEvent = false;
    let eIndex = 0;
    const maxDistance = 2000; // Maximum distance in meters
    const point = [direction.point[0], direction.point[1]];
    events.map((event) => {
      const eventIndex = findEventContainingPoint(point, events);
      if (eventIndex !== -1) { 
        isPointWinthinEvent = true;
        eIndex = eventIndex;
      }      
    });

    const nearbyCameraIndices = findCamerasWithinDistance(cameras, point, maxDistance);
   
    const nearbyCameras = listCamerasByIndices(cameras, nearbyCameraIndices);

    if (direction.type === 'START') {
      return (<div key={'e'-index}>
        <div key={'leave'-index}><h3>Leave from: {direction.name}</h3></div>
        
        <div key={'text-1-' + index}>{(index<directions.length-1) && direction.text}</div> 
        {isPointWinthinEvent && <div><div>
        <br />
        <div><img className="map-icon route-event-img" src={eventIcon} alt="Event Icon" />{events[eIndex].description}</div>
            </div></div>}
        <br />
        {nearbyCameras.map((camera, index) => (
          <div key={'camera-1'-index}>
            <div>
            <img className="map-icon route-camera-img" src={videoIcon} alt="Video Icon" />
              {camera.caption}</div>
          </div>
        ))}
        <br />
        </div>
        );
    } else {
      if(index === directions.length - 2) {
        return (<div key={'c'-index}>
          <div key={'to'-index}><h3>To: {direction.name}</h3></div>
          
          <div key={'text-2-' + index}>{(index<directions.length-1) && direction.text}</div>
          {isPointWinthinEvent && <div><div>
          <br />
          <div><img className="map-icon route-event-img" src={eventIcon} alt="Event Icon" />{events[eIndex].description}</div>
            </div></div>}
          <br />
          {nearbyCameras.map((camera, index) => (
          <div key={'near-2'-index}>
            <div>
            <img className="map-icon route-camera-img" src={videoIcon} alt="Video Icon" />
              {camera.caption}</div>
          </div>
        ))}
        <br />
          </div>
          )
      } else if((index === directions.length - 1)) {
        // pass
      }
      else {
        return (<div key={'d'-index}>
          <div key={'direction'-index}><h3>Via: {direction.name}</h3></div>
          
          <div key={'text-3' + index}>{(index<directions.length-1) && direction.text}</div>
          {isPointWinthinEvent && <div><div>
          <br />
          <div><img className="map-icon route-event-img" src={eventIcon} alt="Event Icon" />{events[eIndex].description}</div>
            </div></div>}
          <br />
          {nearbyCameras.map((camera, index) => (
          <div key={'near-1'-index}>
            <div>
            <img className="map-icon route-camera-img" src={videoIcon} alt="Video Icon" />
              {camera.caption}</div>
          </div>
        ))}
        <br />
          </div>
          );
      }
    }
  });

  return (    
    <div className='route-details-wrapper'>
      <RouteDetailsContainer>
        <div className="route-details">
        <h4>&lt; <a href='#' onClick={handleBack}> Back to route options </a></h4>
        <ScrollableContainer>
        <div className="layer-item">
            <div>
              {directionElements}
              <div>
                {totalHours} hours {totalMinutes} minutes ({roundedTotalDistance} km)
              </div>
            </div>
        </div>
        <br />
        <div className="layer-item">      
            <div>
              {textElements}
            </div>
        </div>
        </ScrollableContainer>
        </div>
        </RouteDetailsContainer>
    </div>
  );
}