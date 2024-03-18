// React
import React from 'react';
import Container from 'react-bootstrap/Container';

export default function EmptyBulletin() {
  // Rendering
  return (
    <div>
      <h4 className='bulletin-li-title'>No bulletins at the moment</h4>
      <Container className="bulletin-body-container cms-body">
        <div className="bulletin-body-container cms-body container">
          <p>
            There are currently no bulletins to display. 
            As we continue to evolve DriveBC to better meet the needs of British Columbians, 
            watch this space for updates as they come!
          </p>
        </div>
      </Container>
    </div>
  );
}
