// React
import React from 'react';

// Third party packages
import Container from 'react-bootstrap/Container';

// Components and functions
import Footer from '../Footer';

export default function AdvisoryDetailPage() {
  return (
    <div className='advisory-page'>
      <div className="page-header">
        <Container>
          <h1 className="page-title">Advisory</h1>
          <p className="page-description body--large">Short description of the advisory.</p>
          <span>Last update timestamp</span>
        </Container>
      </div>
      <Container>
        <p>Content of the advisory.</p>
      </Container>
      <Footer />
    </div>
  );
}
