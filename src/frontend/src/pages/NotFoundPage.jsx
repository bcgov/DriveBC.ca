// React
import React from 'react';

// Internal imports
import Container from 'react-bootstrap/Container';
import Footer from '../Footer';

// Styling
import './NotFoundPage.scss';

export default function NotFoundPage() {
  document.title = 'DriveBC - Not Found';

  return (
    <div className='not-found-page'>
      <Container className='text-container'>
        <h1>This page does not exist</h1>
        <span>Please use the navigation above or below to go to a valid DriveBC page.</span>
      </Container>

      <Footer />
    </div>
  );
}
