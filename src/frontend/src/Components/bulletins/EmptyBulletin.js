// React
import React from 'react';
import Container from 'react-bootstrap/Container';

export default function EmptyBulletin() {
  // Rendering
  return (
    <Container className="empty-advisory-display">
      <h2>No bulletins at the moment</h2>
      <p>
        There are currently no bulletins to display. 
        As we continue to evolve DriveBC to better meet the needs of British Columbians, 
        watch this space for updates as they come!
      </p>
  </Container>
  );
}
