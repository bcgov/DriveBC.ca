import React from 'react';
import Container from 'react-bootstrap/Container';
import CameraList from '../Components/cameras/CameraList'

export default function MapPage() {
  return (
    <div>
    <Container>
      <CameraList></CameraList>
      </Container>
      </div>
  );
}