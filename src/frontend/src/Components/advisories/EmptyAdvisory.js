// React
import React from 'react';
import Container from 'react-bootstrap/Container';

export default function EmptyAdvisory() {
  // Rendering
  return (
    <div>
      <h4 className='advisory-li-title'>No advisories are active at the moment</h4>
      <Container className="advisory-body-container cms-body">
        <div className="advisory-body-container cms-body container">
          <p>
            If there are widespread travel advisories, they will be posted here to give you guidance on:
          </p>
          <ul>
            <li>how to navigate safely through the affected area</li>
            <li>where to detour if available, and</li>
            <li>keep you informed with the most up-to-date information we have.</li>
          </ul>  
        </div>
      </Container>
    </div>
  );
}
