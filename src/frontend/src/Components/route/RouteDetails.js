// React
import React from 'react';

// Static files
import videoIcon from '../../assets/video-solid.png';
import eventIcon from '../../assets/exclamation-triangle-solid.png';

// Styling
import './RouteDetails.scss';
import styled from 'styled-components'; 

const RouteDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ScrollableContainer = styled.div`
  max-height: 400px; /* Adjust the maximum height as needed */
  overflow-y: auto;
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
    const eventLocation = events[i].location.coordinates; // Replace this with your actual data structure
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
      nearbyCameras.push(i); // Store the index of the camera within 100 meters
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



export default function RouteDetails({events, cameras, directions}) {
  console.log(events);
  console.log(cameras);
  console.log(directions);


  if (!directions || directions.length === 0) {
    return null;
  }


  const directionElements = directions.map((direction, index) => {
    if (direction.type === 'START') {
      return <div key={index}>From: {direction.name}</div>;
    } else {
      if(index === directions.length - 2) {
        return <div key={index}>To: {direction.name}</div>
      } else if((index === directions.length - 1)) {
        // pass
      }
      else {
        return <div key={index}>via: {direction.name}</div>;
      }
      
    }
  });

  // const totalDirectionTime = directions.reduce((total, direction) => total + direction.time, 0);
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
      // const eventLocations = event.location.coordinates;
  
      const eventIndex = findEventContainingPoint(point, events);
      if (eventIndex !== -1) {
        console.log(`Point is within event ${eventIndex + 1}`);
        isPointWinthinEvent = true;
        eIndex = eventIndex;
      } else {
        console.log('Point is not within any event MBR');
      }      
    });

    const nearbyCameraIndices = findCamerasWithinDistance(cameras, point, maxDistance);
    console.log('Cameras within 100 meters:', nearbyCameraIndices);

    const nearbyCameras = listCamerasByIndices(cameras, nearbyCameraIndices);

    if (direction.type === 'START') {
      return (<div key={'e'-index}>
        <div key={index}><h3>Leave from: {direction.name}</h3></div>
        <div key={'text-' + index}>{(index<directions.length-1) && direction.text}</div>
        <div><div>
        <img className="map-icon" src={eventIcon} alt="Event Icon" />
          Event: </div><div>{isPointWinthinEvent && events[eIndex].description}</div></div>
        {nearbyCameras.map((camera, index) => (
          <div key={index}>
            <div>
            <img className="map-icon" src={videoIcon} alt="Video Icon" />
              Highway camera: {camera.caption}</div>
          </div>
        ))}

        </div>
        );
    } else {
      if(index === directions.length - 2) {
        return (<div key={'c'-index}>
          <div key={index}><h3>To: {direction.name}</h3></div>
          <div key={'text-' + index}>{(index<directions.length-1) && direction.text}</div>
          <div><div>
          <img className="map-icon" src={eventIcon} alt="Event Icon" />
            Event: </div><div>{isPointWinthinEvent && events[eIndex].description}</div></div>
          {nearbyCameras.map((camera, index) => (
          <div key={index}>
            <div>
            <img className="map-icon" src={videoIcon} alt="Video Icon" />
              Highway camera: {camera.caption}</div>
          </div>
        ))}
          </div>
          )
      } else if((index === directions.length - 1)) {
        // pass
      }
      else {
        return (<div key={'d'-index}>
          <div key={index}><h3>via: {direction.name}</h3></div>
          <div key={'text-' + index}>{(index<directions.length-1) && direction.text}</div>
          <div><div>
          <img className="map-icon" src={eventIcon} alt="Event Icon" />
            Event: </div><div>{isPointWinthinEvent && events[eIndex].description}</div></div>
          {nearbyCameras.map((camera, index) => (
          <div key={index}>
            <div>
            <img className="map-icon" src={videoIcon} alt="Video Icon" />
              Highway camera: {camera.caption}</div>
          </div>
        ))}
          </div>
          );
      }
      
    }
  });

  return (    
    <div className='route-details-wrapper'>
      <RouteDetailsContainer>
        <div className="route-details">
        <h4>&lt; <a href='#'> Back to route options </a></h4>
        <ScrollableContainer>
        <div className="layer-item">
            <div>
              {directionElements}
              <div>
                {totalHours} hours {totalMinutes} minutes ({roundedTotalDistance} km)
              </div>
            </div>
        </div>
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
